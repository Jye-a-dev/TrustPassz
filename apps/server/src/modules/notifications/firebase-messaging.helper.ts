import { Logger } from '@nestjs/common';
import { ServiceAccount } from 'firebase-admin/app';
import { Messaging, MulticastMessage } from 'firebase-admin/messaging';
import {
  EscrowPushEventType,
  EscrowPushPayloadData,
} from './notifications.types';

export const TRUSTPASSZ_ESCROW_CHANNEL_ID = 'trustpassz_escrow_alerts';
export const MAX_FCM_ATTEMPTS = 3;
export const RETRY_BASE_DELAY_MS = 250;

const INVALID_TOKEN_ERROR_CODES = new Set<string>([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/mismatched-credential',
]);

const TRANSIENT_FCM_ERROR_CODES = new Set<string>([
  'messaging/server-unavailable',
  'messaging/internal-error',
  'messaging/unknown-error',
  'app/network-error',
  'app/network-timeout',
]);

interface ResolvedCopy {
  title: string;
  body: string;
  route: string;
  action: string;
}

export interface MulticastRetryOutcome {
  sent: number;
  failed: number;
  deadTokens: string[];
  lastErrorMessage?: string;
}

function formatDisplayAmount(
  rawAmount: string | number | undefined,
  currency = 'VND',
): string {
  if (rawAmount === undefined || rawAmount === null) return '';
  const num = Number(rawAmount);
  if (!Number.isFinite(num)) return String(rawAmount);
  if (currency.toUpperCase() === 'VND') {
    return `${Math.round(num).toLocaleString('vi-VN')} VND`;
  }
  return `${num} ${currency}`;
}

export function resolveEscrowPushCopy(
  eventType: EscrowPushEventType,
  data: EscrowPushPayloadData,
): ResolvedCopy {
  const titleHint = data.dealTitle
    ? `"${data.dealTitle}"`
    : `Deal ${data.dealId.slice(0, 8)}`;
  const priceText = formatDisplayAmount(data.price, data.currency);
  const amountText = formatDisplayAmount(data.amount, data.currency);

  switch (eventType) {
    case 'NEW_DEAL':
      return {
        title: 'Giao dịch ký quỹ mới đang chờ xác nhận',
        body: priceText
          ? `Bạn nhận được giao dịch ${titleHint} trị giá ${priceText}. Mở phòng giao dịch để xem chi tiết.`
          : `Bạn nhận được giao dịch ký quỹ mới ${titleHint}.`,
        route: data.route ?? '/deal-room',
        action: data.action ?? 'VIEW_DEAL',
      };
    case 'OFFER_UPDATED':
      return {
        title: 'Đề xuất giá mới từ đối tác',
        body: priceText
          ? `Đối tác vừa cập nhật mức giá thỏa thuận ${priceText} cho ${titleHint}.`
          : `Mức giá thương lượng cho ${titleHint} vừa được cập nhật.`,
        route: data.route ?? '/deal-room',
        action: data.action ?? 'VIEW_DEAL',
      };
    case 'DEPOSIT_SUCCESS':
      return {
        title: 'Xác nhận cọc tiền thành công',
        body: amountText
          ? `Khoản ký quỹ ${amountText} đã vào hợp đồng bảo chứng. Sẵn sàng mở két Digital Vault.`
          : `Khoản ký quỹ cho ${titleHint} đã vào hợp đồng bảo chứng an toàn.`,
        route: data.route ?? '/deal-room',
        action: data.action ?? 'INSPECT_ESCROW',
      };
    case 'VAULT_UNLOCKED':
      return {
        title: 'Két số đã mở - Bắt đầu đồng kiểm',
        body: `Digital Vault cho ${titleHint} đã được giải mã. Cửa sổ đồng kiểm nghiệm thu đang đếm ngược.`,
        route: data.route ?? '/vault',
        action: data.action ?? 'START_INSPECTION',
      };
  }
}

export function buildEscrowMulticastMessage(
  tokens: string[],
  eventType: EscrowPushEventType,
  data: EscrowPushPayloadData,
): MulticastMessage {
  const copy = resolveEscrowPushCopy(eventType, data);
  const stringData: Record<string, string> = {
    type: eventType,
    dealId: data.dealId,
    route: copy.route,
    action: copy.action,
  };

  if (data.dealTitle) stringData.dealTitle = data.dealTitle;
  if (data.price !== undefined) stringData.price = String(data.price);
  if (data.amount !== undefined) stringData.amount = String(data.amount);
  if (data.currency) stringData.currency = data.currency;
  if (data.txHash) stringData.txHash = data.txHash;
  if (data.status) stringData.status = data.status;
  if (data.vaultId) stringData.vaultId = data.vaultId;
  if (data.inspectionDeadline) {
    stringData.inspectionDeadline = data.inspectionDeadline;
  }
  if (data.proposedBy) stringData.proposedBy = data.proposedBy;

  return {
    tokens,
    notification: { title: copy.title, body: copy.body },
    data: stringData,
    android: {
      priority: 'high',
      notification: {
        channelId: TRUSTPASSZ_ESCROW_CHANNEL_ID,
        color: '#10B981',
        icon: 'ic_notification',
        sound: 'default',
        defaultSound: true,
        defaultVibrateTimings: true,
        priority: 'high',
        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
      },
    },
    apns: {
      headers: { 'apns-priority': '10', 'apns-push-type': 'alert' },
      payload: {
        aps: {
          alert: { title: copy.title, body: copy.body },
          badge: 1,
          sound: 'default',
          contentAvailable: true,
        },
      },
    },
  };
}

export function parseServiceAccountJson(raw: string): ServiceAccount | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const jsonText = trimmed.startsWith('{')
      ? trimmed
      : Buffer.from(trimmed, 'base64').toString('utf8');
    const parsed = JSON.parse(jsonText) as ServiceAccount & {
      private_key?: string;
      client_email?: string;
      project_id?: string;
    };
    const projectId = parsed.projectId ?? parsed.project_id;
    const clientEmail = parsed.clientEmail ?? parsed.client_email;
    const privateKey = (parsed.privateKey ?? parsed.private_key)?.replace(
      /\\n/g,
      '\n',
    );

    if (!projectId || !clientEmail || !privateKey) return null;
    return { projectId, clientEmail, privateKey };
  } catch {
    return null;
  }
}

export function isDeadTokenErrorCode(code: string | undefined): boolean {
  return typeof code === 'string' && INVALID_TOKEN_ERROR_CODES.has(code);
}

export function isTransientFcmErrorCode(code: string | undefined): boolean {
  return typeof code === 'string' && TRANSIENT_FCM_ERROR_CODES.has(code);
}

export function isTransientFcmError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const record = error as { code?: unknown; message?: unknown };
  const code = typeof record.code === 'string' ? record.code : '';
  const msg =
    typeof record.message === 'string' ? record.message.toLowerCase() : '';
  return (
    isTransientFcmErrorCode(code) ||
    /econnreset|etimedout|enotfound|eai_again|econnrefused|network|timeout|unavailable|socket hang up/.test(
      msg,
    )
  );
}

export function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendMulticastWithRetry(
  messaging: Messaging,
  tokens: string[],
  eventType: EscrowPushEventType,
  data: EscrowPushPayloadData,
  userId: string,
  logger: Logger,
): Promise<MulticastRetryOutcome> {
  let pendingTokens = [...tokens];
  let totalSent = 0;
  let totalPermanentFailures = 0;
  const deadTokens: string[] = [];
  let lastErrorMessage: string | undefined;

  for (let attempt = 1; attempt <= MAX_FCM_ATTEMPTS; attempt++) {
    if (pendingTokens.length === 0) break;
    const message = buildEscrowMulticastMessage(pendingTokens, eventType, data);

    try {
      const response = await messaging.sendEachForMulticast(message);
      const retryTokens: string[] = [];
      totalSent += response.successCount;

      response.responses.forEach((res, idx) => {
        if (res.success) return;
        const token = pendingTokens[idx];
        const errCode = res.error?.code;
        if (token && isDeadTokenErrorCode(errCode)) {
          deadTokens.push(token);
          totalPermanentFailures += 1;
        } else if (
          token &&
          attempt < MAX_FCM_ATTEMPTS &&
          isTransientFcmErrorCode(errCode)
        ) {
          retryTokens.push(token);
        } else {
          totalPermanentFailures += 1;
        }
      });

      pendingTokens = retryTokens;
      if (pendingTokens.length > 0 && attempt < MAX_FCM_ATTEMPTS) {
        await sleepMs(RETRY_BASE_DELAY_MS * attempt);
      }
    } catch (error: unknown) {
      lastErrorMessage = error instanceof Error ? error.message : String(error);
      if (attempt < MAX_FCM_ATTEMPTS && isTransientFcmError(error)) {
        logger.warn(
          `[FCM] Transient dispatch error for user=${userId} (attempt ${attempt}/${MAX_FCM_ATTEMPTS}): ${lastErrorMessage}`,
        );
        await sleepMs(RETRY_BASE_DELAY_MS * attempt);
        continue;
      }
      logger.error(
        `[FCM] Dispatch failed for user=${userId} event=${eventType}: ${lastErrorMessage}`,
      );
      return {
        sent: totalSent,
        failed: pendingTokens.length + totalPermanentFailures,
        deadTokens,
        lastErrorMessage,
      };
    }
  }

  return {
    sent: totalSent,
    failed: totalPermanentFailures + pendingTokens.length,
    deadTokens,
    lastErrorMessage,
  };
}

export function dispatchEscrowPush(
  notifier:
    | {
        sendEscrowPushNotification: (
          userId: string,
          eventType: EscrowPushEventType,
          data: EscrowPushPayloadData,
        ) => Promise<unknown>;
      }
    | undefined,
  userIds: Array<string | null | undefined>,
  eventType: EscrowPushEventType,
  data: EscrowPushPayloadData,
): void {
  if (!notifier) return;
  const targets = Array.from(
    new Set(userIds.filter((id): id is string => Boolean(id && id.trim()))),
  );
  for (const uid of targets) {
    void notifier
      .sendEscrowPushNotification(uid, eventType, data)
      .catch(() => {});
  }
}
