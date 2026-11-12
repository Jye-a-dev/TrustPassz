import { Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { SupabaseService } from '../../integrations/supabase/supabase.service';
import {
  EscrowPushPayloadData,
  MarkAllReadResponse,
  MarkReadResponse,
  UserNotificationItem,
  UserNotificationType,
  UserNotificationsListResponse,
} from './notifications.types';

interface NotificationRecordRow {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: unknown;
  isRead: boolean;
  createdAt: Date;
}

function formatAmountText(
  rawAmount: string | number | undefined,
  currency = 'VND',
): string {
  if (rawAmount === undefined || rawAmount === null) return '';
  const num = Number(rawAmount);
  if (!Number.isFinite(num)) return String(rawAmount);
  if (currency.toUpperCase() === 'VND') {
    return `${Math.round(num).toLocaleString('vi-VN')} ₫`;
  }
  return `${num} ${currency}`;
}

export function resolveUserNotificationContent(
  type: UserNotificationType,
  payload: EscrowPushPayloadData,
): { title: string; message: string; data: Record<string, unknown> } {
  const titleHint = payload.dealTitle
    ? `"${payload.dealTitle}"`
    : `Kèo #${payload.dealId.slice(0, 8)}`;
  const priceText = formatAmountText(payload.price, payload.currency);
  const amountText = formatAmountText(payload.amount, payload.currency);

  const structuredData: Record<string, unknown> = {
    dealId: payload.dealId,
    ...(payload.dealTitle ? { dealTitle: payload.dealTitle } : {}),
    ...(payload.price !== undefined ? { price: Number(payload.price) } : {}),
    ...(payload.amount !== undefined ? { amount: Number(payload.amount) } : {}),
    ...(payload.currency ? { currency: payload.currency } : {}),
    ...(payload.txHash ? { txHash: payload.txHash } : {}),
    ...(payload.status ? { status: payload.status } : {}),
    ...(payload.vaultId ? { vaultId: payload.vaultId } : {}),
    ...(payload.inspectionDeadline
      ? { inspectionDeadline: payload.inspectionDeadline }
      : {}),
    ...(payload.orderId ? { orderId: payload.orderId } : {}),
    ...(payload.orderNumber ? { orderNumber: payload.orderNumber } : {}),
    ...(payload.disputeId ? { disputeId: payload.disputeId } : {}),
    ...(payload.route ? { route: payload.route } : {}),
  };

  switch (type) {
    case 'DEPOSITED':
      return {
        title: 'Tiền cọc VietQR đã được khóa',
        message: amountText
          ? `Giao dịch ${titleHint} đã xác nhận ký quỹ ${amountText}. Có thể mở két Digital Vault.`
          : `Giao dịch ${titleHint} đã được khóa tiền ký quỹ an toàn.`,
        data: { route: `/user/deals/${payload.dealId}`, ...structuredData },
      };
    case 'SETTLED':
      return {
        title: 'Thanh toán giải ngân thành công',
        message: amountText
          ? `Khoản tiền ${amountText} cho ${titleHint} đã hoàn tất giải ngân an toàn.`
          : `Giao dịch ${titleHint} đã được giải ngân thành công.`,
        data: { route: `/user/deals/${payload.dealId}`, ...structuredData },
      };
    case 'OFFER_UPDATED':
      if (payload.status === 'ACCEPTED') {
        return {
          title: 'Đề xuất trả giá được chấp thuận',
          message: priceText
            ? `Người bán đã đồng ý mức giá ${priceText} cho ${titleHint}. Bạn có thể thanh toán ngay.`
            : `Đề xuất giá cho ${titleHint} đã được chấp thuận.`,
          data: { route: `/user/deals/${payload.dealId}`, ...structuredData },
        };
      }
      if (payload.status === 'REJECTED') {
        return {
          title: 'Đề xuất trả giá chưa được duyệt',
          message: `Người bán vừa phản hồi lại mức giá đề xuất cho ${titleHint}.`,
          data: { route: `/user/deals/${payload.dealId}`, ...structuredData },
        };
      }
      return {
        title: 'Đề xuất giá mới trên Bargain Slider',
        message: priceText
          ? `Đối tác vừa trả giá ${priceText} cho ${titleHint}. Bấm để thương lượng ngay.`
          : `Có đề xuất giá mới cho ${titleHint}.`,
        data: { route: `/user/deals/${payload.dealId}`, ...structuredData },
      };
    case 'NEW_DEAL':
      return {
        title: 'Kèo giao dịch mới vừa được tạo',
        message: priceText
          ? `Bạn nhận được lời mời tham gia ${titleHint} trị giá ${priceText}.`
          : `Bạn vừa được mời tham gia giao dịch ${titleHint}.`,
        data: { route: `/user/deals/${payload.dealId}`, ...structuredData },
      };
    case 'VAULT_UNLOCKED':
      return {
        title: 'Két Digital Vault đã mở - Đếm ngược đồng kiểm',
        message: `Tài sản số trong ${titleHint} đã giải mã. Thời gian đồng kiểm nghiệm thu đang chạy.`,
        data: {
          route: `/user/deals/${payload.dealId}/vault`,
          ...structuredData,
        },
      };
    case 'DISPUTE_RAISED':
      return {
        title: 'Tranh chấp giao dịch mới phát sinh',
        message: payload.reason
          ? `Giao dịch ${titleHint} có khiếu nại mới: "${payload.reason.slice(0, 100)}".`
          : `Giao dịch ${titleHint} vừa chuyển sang trạng thái tranh chấp.`,
        data: { route: `/user/deals/${payload.dealId}`, ...structuredData },
      };
    case 'ORDER_UPDATED':
      return {
        title: 'Cập nhật đơn hàng bảo chứng',
        message: payload.orderNumber
          ? `Đơn hàng ${payload.orderNumber} (${titleHint}) vừa có thay đổi trạng thái.`
          : `Đơn hàng thuộc ${titleHint} vừa được cập nhật.`,
        data: { route: '/user/orders', ...structuredData },
      };
  }
}

export function serializeNotification(
  row: NotificationRecordRow,
): UserNotificationItem {
  const safeData =
    row.data && typeof row.data === 'object' && !Array.isArray(row.data)
      ? (row.data as Record<string, unknown>)
      : {};
  return {
    id: row.id,
    userId: row.userId,
    type: row.type,
    title: row.title,
    message: row.message,
    data: safeData,
    isRead: row.isRead,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function persistAndBroadcastUserNotifications(
  prisma: PrismaService,
  supabaseService: SupabaseService | undefined,
  logger: Logger,
  userIds: Array<string | null | undefined>,
  type: UserNotificationType,
  payload: EscrowPushPayloadData,
): Promise<UserNotificationItem[]> {
  const uniqueUserIds = Array.from(
    new Set(userIds.filter((id): id is string => Boolean(id && id.trim()))),
  );
  if (uniqueUserIds.length === 0) return [];

  const delegate = (
    prisma as unknown as {
      notification?: {
        create?: (args: {
          data: {
            userId: string;
            type: string;
            title: string;
            message: string;
            data: Prisma.InputJsonValue;
          };
        }) => Promise<NotificationRecordRow>;
      };
    }
  )?.notification;

  if (!delegate || typeof delegate.create !== 'function') {
    return [];
  }

  const content = resolveUserNotificationContent(type, payload);
  const createdItems: UserNotificationItem[] = [];

  for (const uid of uniqueUserIds) {
    try {
      const record = await delegate.create({
        data: {
          userId: uid,
          type,
          title: content.title,
          message: content.message,
          data: content.data as Prisma.InputJsonValue,
        },
      });
      const serialized = serializeNotification(record);
      createdItems.push(serialized);

      if (supabaseService) {
        await supabaseService.broadcastUserNotification(uid, {
          ...serialized,
        });
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.warn(
        `Failed to persist/broadcast notification (${type}) for user=${uid}: ${msg}`,
      );
    }
  }

  return createdItems;
}

export async function queryUserNotifications(
  prisma: PrismaService,
  userId: string,
  limit = 20,
  offset = 0,
): Promise<UserNotificationsListResponse> {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);

  const [rows, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
      skip: safeOffset,
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  const items = rows.map(serializeNotification);
  return {
    data: items,
    items,
    unreadCount,
    total,
    limit: safeLimit,
    offset: safeOffset,
  };
}

export async function markUserNotificationAsRead(
  prisma: PrismaService,
  userId: string,
  notificationId: string,
): Promise<MarkReadResponse> {
  const existing = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!existing) {
    throw new NotFoundException(
      `Notification ${notificationId} not found for current user`,
    );
  }

  const updated = existing.isRead
    ? existing
    : await prisma.notification.update({
        where: { id: existing.id },
        data: { isRead: true },
      });

  const unreadCount = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  return {
    success: true,
    notification: serializeNotification(updated),
    unreadCount,
  };
}

export async function markAllUserNotificationsAsRead(
  prisma: PrismaService,
  userId: string,
): Promise<MarkAllReadResponse> {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return {
    success: true,
    updatedCount: result.count,
    unreadCount: 0,
  };
}
