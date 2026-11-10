import * as fs from 'node:fs';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  App,
  ServiceAccount,
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import {
  Messaging,
  MulticastMessage,
  getMessaging,
} from 'firebase-admin/messaging';
import {
  EscrowPushEventType,
  EscrowPushPayloadData,
} from './notifications.types';

export const TRUSTPASSZ_ESCROW_CHANNEL_ID = 'trustpassz_escrow_alerts';

const INVALID_TOKEN_ERROR_CODES = new Set<string>([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/mismatched-credential',
]);

interface ResolvedCopy {
  title: string;
  body: string;
  route: string;
  action: string;
}

/**
 * Formats VND or crypto amounts cleanly for human-readable push banners.
 */
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

/**
 * Resolves localized Vietnamese notification copy, deep-link route, and action for each escrow trigger.
 */
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
        title: 'Kèo ký quỹ mới đang chờ xác nhận',
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

/**
 * Builds an FCM HTTP v1 MulticastMessage with high-priority Android & APNs content-available=1 settings.
 */
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
    notification: {
      title: copy.title,
      body: copy.body,
    },
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
      headers: {
        'apns-priority': '10',
        'apns-push-type': 'alert',
      },
      payload: {
        aps: {
          alert: {
            title: copy.title,
            body: copy.body,
          },
          badge: 1,
          sound: 'default',
          contentAvailable: true,
        },
      },
    },
  };
}

/**
 * Parses service account JSON from raw string or Base64-encoded env value.
 */
function parseServiceAccountJson(raw: string): ServiceAccount | null {
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

/**
 * Lazily initializes Firebase Admin Messaging singleton from ConfigService / environment variables.
 */
export function initializeFirebaseMessaging(
  configService: ConfigService,
  logger: Logger,
): Messaging | null {
  try {
    let app: App | undefined = getApps()[0];

    if (!app) {
      const rawJson =
        configService.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON') ??
        process.env.FIREBASE_SERVICE_ACCOUNT_JSON ??
        '';
      const parsedAccount = parseServiceAccountJson(rawJson);

      if (parsedAccount) {
        app = initializeApp({ credential: cert(parsedAccount) });
      } else {
        const projectId =
          configService.get<string>('FIREBASE_PROJECT_ID') ??
          process.env.FIREBASE_PROJECT_ID;
        const clientEmail =
          configService.get<string>('FIREBASE_CLIENT_EMAIL') ??
          process.env.FIREBASE_CLIENT_EMAIL;
        const rawPrivateKey =
          configService.get<string>('FIREBASE_PRIVATE_KEY') ??
          process.env.FIREBASE_PRIVATE_KEY;

        if (projectId && clientEmail && rawPrivateKey) {
          app = initializeApp({
            credential: cert({
              projectId,
              clientEmail,
              privateKey: rawPrivateKey.replace(/\\n/g, '\n'),
            }),
          });
        } else {
          const credPath =
            configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS') ??
            process.env.GOOGLE_APPLICATION_CREDENTIALS;
          if (credPath && fs.existsSync(credPath)) {
            app = initializeApp({ credential: applicationDefault() });
          }
        }
      }
    }

    if (!app) {
      logger.warn(
        '[FCM] Firebase Admin SDK not configured (missing FIREBASE_SERVICE_ACCOUNT_JSON / FIREBASE_PRIVATE_KEY / GOOGLE_APPLICATION_CREDENTIALS). Push dispatch disabled until credentials are provided.',
      );
      return null;
    }

    logger.log('[FCM] Firebase Admin Messaging initialized successfully.');
    return getMessaging(app);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.warn(`[FCM] Firebase Admin initialization skipped: ${msg}`);
    return null;
  }
}

/**
 * Checks whether an FCM send error code indicates a dead/unregistered device token.
 */
export function isDeadTokenErrorCode(code: string | undefined): boolean {
  return typeof code === 'string' && INVALID_TOKEN_ERROR_CODES.has(code);
}

/**
 * Fire-and-forget helper to dispatch an escrow push notification to one or more users
 * without throwing or blocking primary ACID database/on-chain transactions.
 */
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
