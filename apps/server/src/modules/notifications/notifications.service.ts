import * as fs from 'node:fs';
import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DevicePlatform } from '@prisma/client';
import {
  App,
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import { Messaging, getMessaging } from 'firebase-admin/messaging';
import { Subject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PrismaService } from '../../database/prisma.service';
import { fetchRecentAdminNotifications } from './admin-notifications.helper';
import { DeleteDeviceTokenDto } from './dto/delete-device-token.dto';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import {
  MAX_FCM_ATTEMPTS,
  RETRY_BASE_DELAY_MS,
  dispatchEscrowPush,
  isTransientFcmError,
  parseServiceAccountJson,
  sendMulticastWithRetry,
  sleepMs,
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
  private initPromise: Promise<Messaging | null> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly configService?: ConfigService,
  ) {}

  onModuleInit(): void {
    void this.ensureMessagingReady();
  }

  /** Allows injecting a mocked Messaging instance in unit tests. */
  setMessagingClientForTest(client: Messaging | null): void {
    this.messaging = client;
    this.initPromise = null;
  }

  private getEnv(key: string): string {
    const cfgVal = this.configService?.get<string>(key);
    return (cfgVal ?? process.env[key] ?? '').trim();
  }

  private initializeFirebaseAdminOnce(): Messaging | null {
    let app: App | undefined = getApps()[0];

    if (!app) {
      const serviceAccountJson = this.getEnv('FIREBASE_SERVICE_ACCOUNT_JSON');
      const parsedAccount = parseServiceAccountJson(serviceAccountJson);

      if (parsedAccount) {
        app = initializeApp({ credential: cert(parsedAccount) });
      } else {
        const projectId = this.getEnv('FIREBASE_PROJECT_ID');
        const clientEmail = this.getEnv('FIREBASE_CLIENT_EMAIL');
        const privateKey = this.getEnv('FIREBASE_PRIVATE_KEY').replace(
          /\\n/g,
          '\n',
        );

        if (projectId && clientEmail && privateKey) {
          app = initializeApp({
            credential: cert({ projectId, clientEmail, privateKey }),
          });
        } else {
          const credPath = this.getEnv('GOOGLE_APPLICATION_CREDENTIALS');
          if (credPath && fs.existsSync(credPath)) {
            app = initializeApp({ credential: applicationDefault() });
          }
        }
      }
    }

    if (!app) {
      return null;
    }

    const client = getMessaging(app);
    this.logger.log('[FCM] Firebase Admin Messaging initialized.');
    return client;
  }

  private async ensureMessagingReady(): Promise<Messaging | null> {
    if (this.messaging) return this.messaging;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      for (let attempt = 1; attempt <= MAX_FCM_ATTEMPTS; attempt++) {
        try {
          const client = this.initializeFirebaseAdminOnce();
          if (client) {
            this.messaging = client;
            return client;
          }
          this.logger.error(
            '[FCM] Missing Firebase credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY or FIREBASE_SERVICE_ACCOUNT_JSON).',
          );
          return null;
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          if (attempt < MAX_FCM_ATTEMPTS && isTransientFcmError(error)) {
            this.logger.warn(
              `[FCM] Transient Firebase init failure (attempt ${attempt}/${MAX_FCM_ATTEMPTS}): ${msg}`,
            );
            await sleepMs(RETRY_BASE_DELAY_MS * attempt);
            continue;
          }
          this.logger.error(
            `[FCM] Failed to initialize Firebase Admin SDK: ${msg}`,
          );
          return null;
        }
      }
      return null;
    })().finally(() => {
      this.initPromise = null;
    });

    return this.initPromise;
  }

  emitAdminNotification(item: AdminNotificationItem): void {
    this.logger.log(
      `[REALTIME_NOTIFICATION] Emitting: [${item.type}] ${item.title}`,
    );
    this.adminNotificationSubject.next(item);
  }

  getAdminNotificationStream(): Observable<{ data: AdminNotificationItem }> {
    return this.adminNotificationSubject
      .asObservable()
      .pipe(map((item) => ({ data: item })));
  }

  async getRecentNotifications(): Promise<AdminNotificationItem[]> {
    return fetchRecentAdminNotifications(this.prisma, this.logger);
  }

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

  async deleteDeviceToken(
    userId: string,
    dto: DeleteDeviceTokenDto,
  ): Promise<{ success: boolean; revokedCount: number }> {
    const result = await this.prisma.deviceToken.deleteMany({
      where: { token: dto.token, userId },
    });

    this.logger.log(
      `[FCM] Revoked ${result.count} device token(s) for user=${userId}`,
    );

    return { success: true, revokedCount: result.count };
  }

  async getTokensForUser(userId: string): Promise<string[]> {
    const records = await this.prisma.deviceToken.findMany({
      where: { userId, isActive: true },
      select: { token: true },
      orderBy: { lastUsedAt: 'desc' },
    });
    return records.map((r) => r.token);
  }

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

    const messaging = this.messaging ?? (await this.ensureMessagingReady());
    if (!messaging) {
      return {
        sent: 0,
        failed: tokens.length,
        revokedTokens: 0,
        latencyMs: Date.now() - startedAt,
        skipped: true,
        reason: 'FIREBASE_CREDENTIALS_MISSING',
      };
    }

    const outcome = await sendMulticastWithRetry(
      messaging,
      tokens,
      eventType,
      data,
      userId,
      this.logger,
    );

    if (outcome.deadTokens.length > 0) {
      await this.prisma.deviceToken.deleteMany({
        where: { token: { in: outcome.deadTokens } },
      });
      this.logger.warn(
        `[FCM] Purged ${outcome.deadTokens.length} invalid/expired token(s) for user=${userId}`,
      );
    }

    const latencyMs = Date.now() - startedAt;
    this.logger.log(
      `[FCM] Dispatched ${eventType} dealId=${data.dealId} to user=${userId}: sent=${outcome.sent}, failed=${outcome.failed}, latency=${latencyMs}ms`,
    );

    return {
      sent: outcome.sent,
      failed: outcome.failed,
      revokedTokens: outcome.deadTokens.length,
      latencyMs,
      ...(outcome.lastErrorMessage ? { reason: outcome.lastErrorMessage } : {}),
    };
  }

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

  notifyOfferUpdated(userId: string, data: EscrowPushPayloadData): void {
    dispatchEscrowPush(this, [userId], 'OFFER_UPDATED', data);
  }

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
