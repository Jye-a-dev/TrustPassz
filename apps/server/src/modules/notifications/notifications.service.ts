import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDeviceTokenDto, UnregisterDeviceTokenDto } from './dto/device-token.dto';

export interface AdminNotificationItem {
  id: string;
  type: 'DEAL' | 'DISPUTE' | 'EMERGENCY_ALERT';
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  linkUrl: string;
  createdAt: string;
}

interface ActiveDeviceSession {
  token: string;
  userId: string;
  platform: 'android' | 'ios';
  deviceModel?: string;
  appVersion?: string;
  updatedAt: Date;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly tokenRegistry = new Map<string, ActiveDeviceSession>();
  private readonly adminNotificationSubject = new Subject<AdminNotificationItem>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Broadcast an authentic event to all connected admin clients via SSE
   */
  emitAdminNotification(item: AdminNotificationItem): void {
    this.logger.log(`[REALTIME_NOTIFICATION] Emitting: [${item.type}] ${item.title}`);
    this.adminNotificationSubject.next(item);
  }

  /**
   * Returns an Observable stream for SSE connections
   */
  getAdminNotificationStream(): Observable<{ data: AdminNotificationItem }> {
    return this.adminNotificationSubject.asObservable().pipe(
      map((item) => ({ data: item })),
    );
  }

  /**
   * Query authentic real events from database to populate initial notification feed
   */
  async getRecentNotifications(): Promise<AdminNotificationItem[]> {
    try {
      const [recentDeals, recentDisputes, recentAlerts] = await Promise.all([
        this.prisma.deal.findMany({
          orderBy: { createdAt: 'desc' },
          take: 4,
          select: {
            id: true,
            title: true,
            state: true,
            amount: true,
            currency: true,
            createdAt: true,
          },
        }),
        this.prisma.disputeLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 4,
          include: {
            deal: {
              select: { title: true },
            },
          },
        }),
        this.prisma.emergencyDispatchLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 4,
          select: {
            id: true,
            alertType: true,
            severity: true,
            subject: true,
            status: true,
            latencyMs: true,
            createdAt: true,
          },
        }),
      ]);

      const items: AdminNotificationItem[] = [];

      recentDeals.forEach((d) => {
        const isSettled = d.state === 'SETTLED';
        items.push({
          id: `deal-${d.id}`,
          type: 'DEAL',
          severity: isSettled ? 'SUCCESS' : 'INFO',
          title: isSettled ? 'Tất toán thành công' : 'Giao dịch mới',
          message: `Giao dịch "${d.title}" (${d.id.slice(0, 8)}) trạng thái: ${d.state} (${Number(d.amount).toLocaleString('vi-VN')} ${d.currency})`,
          linkUrl: '/deals',
          createdAt: d.createdAt.toISOString(),
        });
      });

      recentDisputes.forEach((disp) => {
        const confPercent = disp.aiConfidenceScore ? Math.round(Number(disp.aiConfidenceScore) * 100) : 0;
        items.push({
          id: `dispute-${disp.id}`,
          type: 'DISPUTE',
          severity: 'WARNING',
          title: 'Khiếu nại phát sinh',
          message: `Giao dịch "${disp.deal?.title || disp.dealId.slice(0, 8)}" có khiếu nại (AI Verdict: ${disp.aiVerdict || 'PENDING'}, Tin cậy: ${confPercent}%)`,
          linkUrl: '/disputes',
          createdAt: disp.createdAt.toISOString(),
        });
      });

      recentAlerts.forEach((alert) => {
        items.push({
          id: `alert-${alert.id}`,
          type: 'EMERGENCY_ALERT',
          severity: alert.status === 'SENT' ? 'INFO' : 'CRITICAL',
          title: `Cảnh báo ${alert.alertType}`,
          message: `${alert.subject} - Trạng thái: ${alert.status} (${alert.latencyMs}ms)`,
          linkUrl: '/admin/settings/emergency-alerts',
          createdAt: alert.createdAt.toISOString(),
        });
      });

      // Sort chronological descending
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return items.slice(0, 10);
    } catch (err: unknown) {
      this.logger.error('Failed to load recent notifications from database:', err);
      return [];
    }
  }

  async registerDeviceToken(dto: RegisterDeviceTokenDto): Promise<{ success: boolean; registeredAt: string }> {
    const session: ActiveDeviceSession = {
      ...dto,
      updatedAt: new Date(),
    };

    this.tokenRegistry.set(dto.token, session);
    this.logger.log(`[FCM] Registered token for user ${dto.userId} (${dto.platform})`);

    return {
      success: true,
      registeredAt: session.updatedAt.toISOString(),
    };
  }

  async unregisterDeviceToken(dto: UnregisterDeviceTokenDto): Promise<{ success: boolean }> {
    const existing = this.tokenRegistry.get(dto.token);
    if (existing && existing.userId === dto.userId) {
      this.tokenRegistry.delete(dto.token);
      this.logger.log(`[FCM] Revoked token for user ${dto.userId}`);
    }
    return { success: true };
  }

  async getTokensForUser(userId: string): Promise<string[]> {
    const tokens: string[] = [];
    for (const [token, session] of this.tokenRegistry.entries()) {
      if (session.userId === userId) {
        tokens.push(token);
      }
    }
    return tokens;
  }
}
