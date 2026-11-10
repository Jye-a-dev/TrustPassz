import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DevicePlatform } from '@prisma/client';
import { Messaging } from 'firebase-admin/messaging';
import { Subject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PrismaService } from '../../database/prisma.service';
import { DeleteDeviceTokenDto } from './dto/delete-device-token.dto';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import {
  buildEscrowMulticastMessage,
  dispatchEscrowPush,
  initializeFirebaseMessaging,
  isDeadTokenErrorCode,
} from './firebase-messaging.helper';
import {
  AdminNotificationItem,
  EscrowPushEventType,
  EscrowPushPayloadData,
  PushDispatchResult,
} from './notifications.types';

export type { AdminNotificationItem } from './notifications.types';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly adminNotificationSubject =
    new Subject<AdminNotificationItem>();
  private messaging: Messaging | null = null;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly configService?: ConfigService,
  ) {}

  onModuleInit(): void {
    const cfg = this.configService ?? new ConfigService();
    this.messaging = initializeFirebaseMessaging(cfg, this.logger);
  }

  /** Allows injecting a mocked Messaging instance in unit tests. */
  setMessagingClientForTest(client: Messaging | null): void {
    this.messaging = client;
  }

  /**
   * Broadcasts an authentic event to all connected admin clients via SSE.
   */
  emitAdminNotification(item: AdminNotificationItem): void {
    this.logger.log(
      `[REALTIME_NOTIFICATION] Emitting: [${item.type}] ${item.title}`,
    );
    this.adminNotificationSubject.next(item);
  }

  /**
   * Returns an Observable stream for Admin SSE connections.
   */
  getAdminNotificationStream(): Observable<{ data: AdminNotificationItem }> {
    return this.adminNotificationSubject
      .asObservable()
      .pipe(map((item) => ({ data: item })));
  }

  /**
   * Queries authentic recent events from database to populate the admin notification feed.
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
          include: { deal: { select: { title: true } } },
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

      for (const d of recentDeals) {
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
      }

      for (const disp of recentDisputes) {
        const confPercent = disp.aiConfidenceScore
          ? Math.round(Number(disp.aiConfidenceScore) * 100)
          : 0;
        items.push({
          id: `dispute-${disp.id}`,
          type: 'DISPUTE',
          severity: 'WARNING',
          title: 'Khiếu nại phát sinh',
          message: `Giao dịch "${disp.deal?.title || disp.dealId.slice(0, 8)}" có khiếu nại (AI Verdict: ${disp.aiVerdict || 'PENDING'}, Tin cậy: ${confPercent}%)`,
          linkUrl: '/disputes',
          createdAt: disp.createdAt.toISOString(),
        });
      }

      for (const alert of recentAlerts) {
        items.push({
          id: `alert-${alert.id}`,
          type: 'EMERGENCY_ALERT',
          severity: alert.status === 'SENT' ? 'INFO' : 'CRITICAL',
          title: `Cảnh báo ${alert.alertType}`,
          message: `${alert.subject} - Trạng thái: ${alert.status} (${alert.latencyMs}ms)`,
          linkUrl: '/admin/settings/emergency-alerts',
          createdAt: alert.createdAt.toISOString(),
        });
      }

      items.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      return items.slice(0, 10);
    } catch (err: unknown) {
      this.logger.error(
        'Failed to load recent notifications from database:',
        err,
      );
      return [];
    }
  }

  /**
   * Registers or refreshes a device FCM token in Prisma `device_tokens`,
   * binding ownership strictly to the authenticated JWT `userId`.
   */
  async registerDeviceToken(
    userId: string,
    dto: RegisterDeviceTokenDto,
  ): Promise<{ success: boolean; registeredAt: string; platform: string }> {
    const platformEnum =
      dto.platform === 'ios' ? DevicePlatform.IOS : DevicePlatform.ANDROID;
    const now = new Date();

    const record = await this.prisma.deviceToken.upsert({
      where: { token: dto.token },
      update: {
        userId,
        platform: platformEnum,
        deviceModel: dto.deviceModel ?? null,
        appVersion: dto.appVersion ?? null,
        isActive: true,
        lastUsedAt: now,
      },
      create: {
        userId,
        token: dto.token,
        platform: platformEnum,
        deviceModel: dto.deviceModel ?? null,
        appVersion: dto.appVersion ?? null,
        isActive: true,
        lastUsedAt: now,
      },
    });

    this.logger.log(
      `[FCM] Upserted token id=${record.id} for user=${userId} (${dto.platform})`,
    );

    return {
      success: true,
      registeredAt: record.updatedAt.toISOString(),
      platform: dto.platform,
    };
  }

  /**
   * Revokes an FCM device token owned by the authenticated user on logout.
   */
  async deleteDeviceToken(
    userId: string,
    dto: DeleteDeviceTokenDto,
  ): Promise<{ success: boolean; revokedCount: number }> {
    const result = await this.prisma.deviceToken.deleteMany({
      where: {
        token: dto.token,
        userId,
      },
    });

    this.logger.log(
      `[FCM] Revoked ${result.count} device token(s) for user=${userId}`,
    );

    return {
      success: true,
      revokedCount: result.count,
    };
  }

  /**
   * Returns all active FCM registration tokens for a given user.
   */
  async getTokensForUser(userId: string): Promise<string[]> {
    const records = await this.prisma.deviceToken.findMany({
      where: { userId, isActive: true },
      select: { token: true },
      orderBy: { lastUsedAt: 'desc' },
    });
    return records.map((r) => r.token);
  }

  /**
   * Dispatches a high-priority escrow push notification to all active devices of `userId`.
   * Automatically cleans up invalid/unregistered FCM tokens from `device_tokens`.
   */
  async sendEscrowPushNotification(
    userId: string,
    eventType: EscrowPushEventType,
    data: EscrowPushPayloadData,
  ): Promise<PushDispatchResult> {
    const startedAt = Date.now();
    const tokens = await this.getTokensForUser(userId);

    if (tokens.length === 0) {
      return {
        sent: 0,
        failed: 0,
        revokedTokens: 0,
        latencyMs: Date.now() - startedAt,
        skipped: true,
        reason: 'NO_ACTIVE_DEVICE_TOKENS',
      };
    }

    if (!this.messaging) {
      return {
        sent: 0,
        failed: 0,
        revokedTokens: 0,
        latencyMs: Date.now() - startedAt,
        skipped: true,
        reason: 'FIREBASE_ADMIN_NOT_CONFIGURED',
      };
    }

    const message = buildEscrowMulticastMessage(tokens, eventType, data);

    try {
      const response = await this.messaging.sendEachForMulticast(message);
      const deadTokens: string[] = [];

      response.responses.forEach((res, idx) => {
        if (!res.success && isDeadTokenErrorCode(res.error?.code)) {
          const invalidToken = tokens[idx];
          if (invalidToken) {
            deadTokens.push(invalidToken);
          }
        }
      });

      if (deadTokens.length > 0) {
        await this.prisma.deviceToken.deleteMany({
          where: { token: { in: deadTokens } },
        });
        this.logger.warn(
          `[FCM] Purged ${deadTokens.length} invalid/expired token(s) for user=${userId}`,
        );
      }

      const latencyMs = Date.now() - startedAt;
      this.logger.log(
        `[FCM] Dispatched ${eventType} dealId=${data.dealId} to user=${userId}: sent=${response.successCount}, failed=${response.failureCount}, latency=${latencyMs}ms`,
      );

      return {
        sent: response.successCount,
        failed: response.failureCount,
        revokedTokens: deadTokens.length,
        latencyMs,
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[FCM] Dispatch failed for user=${userId} event=${eventType}: ${msg}`,
      );
      return {
        sent: 0,
        failed: tokens.length,
        revokedTokens: 0,
        latencyMs: Date.now() - startedAt,
        reason: msg,
      };
    }
  }

  /** Fire-and-forget convenience dispatcher for new deal creation (Scenario 1). */
  notifyDealCreated(deal: {
    id: string;
    buyerId?: string | null;
    title: string;
    amount: unknown;
    currency: string;
  }): void {
    dispatchEscrowPush(this, [deal.buyerId], 'NEW_DEAL', {
      dealId: deal.id,
      dealTitle: deal.title,
      price: Number(deal.amount),
      currency: deal.currency,
    });
  }

  /** Fire-and-forget convenience dispatcher for bargain updates (Scenario 1). */
  notifyOfferUpdated(userId: string, data: EscrowPushPayloadData): void {
    dispatchEscrowPush(this, [userId], 'OFFER_UPDATED', data);
  }

  /** Fire-and-forget convenience dispatcher for confirmed escrow deposits (Scenario 2). */
  notifyDepositSuccess(
    deal: {
      id: string;
      sellerId: string;
      buyerId?: string | null;
      title: string;
      amount: unknown;
      currency: string;
    },
    txHash?: string | null,
  ): void {
    dispatchEscrowPush(this, [deal.sellerId, deal.buyerId], 'DEPOSIT_SUCCESS', {
      dealId: deal.id,
      dealTitle: deal.title,
      amount: Number(deal.amount),
      currency: deal.currency,
      status: 'DEPOSITED',
      txHash: txHash ?? undefined,
    });
  }

  /** Fire-and-forget convenience dispatcher when buyer unlocks Digital Vault (Scenario 3). */
  notifyVaultUnlocked(
    deal: {
      id: string;
      sellerId: string;
      title: string;
      inspectionDeadline?: Date | null;
    },
    vaultId: string,
  ): void {
    dispatchEscrowPush(this, [deal.sellerId], 'VAULT_UNLOCKED', {
      dealId: deal.id,
      dealTitle: deal.title,
      vaultId,
      inspectionDeadline: deal.inspectionDeadline?.toISOString(),
    });
  }
}
