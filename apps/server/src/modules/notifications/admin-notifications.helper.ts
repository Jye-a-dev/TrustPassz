import { Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AdminNotificationItem } from './notifications.types';

/**
 * Queries recent Deals, Disputes, and Emergency Alerts from PostgreSQL
 * to populate the Admin SSE / REST notification feed.
 */
export async function fetchRecentAdminNotifications(
  prisma: PrismaService,
  logger: Logger,
): Promise<AdminNotificationItem[]> {
  try {
    const [recentDeals, recentDisputes, recentAlerts] = await Promise.all([
      prisma.deal.findMany({
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
      prisma.disputeLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 4,
        include: { deal: { select: { title: true } } },
      }),
      prisma.emergencyDispatchLog.findMany({
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
    logger.error('Failed to load recent notifications from database:', err);
    return [];
  }
}
