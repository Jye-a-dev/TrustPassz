import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DevicePlatform } from '@prisma/client';
import { Messaging } from 'firebase-admin/messaging';
import { Subject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PrismaService } from '../../database/prisma.service';
import { SupabaseService } from '../../integrations/supabase/supabase.service';
import { fetchRecentAdminNotifications } from './admin-notifications.helper';
import { DeleteDeviceTokenDto } from './dto/delete-device-token.dto';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { initializeMessagingWithRetry } from './firebase-admin.helper';
import {
  dispatchEscrowPush,
  sendMulticastWithRetry,
} from './firebase-messaging.helper';
import {
  markAllUserNotificationsAsRead,
  markUserNotificationAsRead,
  persistAndBroadcastUserNotifications,
  queryUserNotifications,
} from './user-notifications.helper';
import {
  AdminNotificationItem,
  EscrowPushEventType,
  EscrowPushPayloadData,
  MarkAllReadResponse,
  MarkReadResponse,
  PushDispatchResult,
  UserNotificationsListResponse,
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
    @Optional() private readonly supabaseService?: SupabaseService,
  ) {}

  onModuleInit(): void {
    void this.ensureMessagingReady();
  }

  /** Allows injecting a mocked Messaging instance in unit tests. */
  setMessagingClientForTest(client: Messaging | null): void {
    this.messaging = client;
    this.initPromise = null;
  }

  private async ensureMessagingReady(): Promise<Messaging | null> {
    if (this.messaging) return this.messaging;
    if (this.initPromise) return this.initPromise;

    this.initPromise = initializeMessagingWithRetry(
      this.logger,
      this.configService,
    )
      .then((client) => {
        if (client) this.messaging = client;
        return client;
      })
      .finally(() => {
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

  async getUserNotifications(
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<UserNotificationsListResponse> {
    return queryUserNotifications(this.prisma, userId, limit, offset);
  }

  async markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<MarkReadResponse> {
    return markUserNotificationAsRead(this.prisma, userId, notificationId);
  }

  async markAllAsRead(userId: string): Promise<MarkAllReadResponse> {
    return markAllUserNotificationsAsRead(this.prisma, userId);
  }

  notifyDealCreated(deal: {
    id: string;
    buyerId?: string | null;
    title: string;
    amount: unknown;
    currency: string;
  }): void {
    const payload: EscrowPushPayloadData = {
      dealId: deal.id,
      dealTitle: deal.title,
      price: Number(deal.amount),
      currency: deal.currency,
    };
    dispatchEscrowPush(this, [deal.buyerId], 'NEW_DEAL', payload);
    void persistAndBroadcastUserNotifications(
      this.prisma,
      this.supabaseService,
      this.logger,
      [deal.buyerId],
      'NEW_DEAL',
      payload,
    );
  }

  notifyOfferUpdated(userId: string, data: EscrowPushPayloadData): void {
    dispatchEscrowPush(this, [userId], 'OFFER_UPDATED', data);
    void persistAndBroadcastUserNotifications(
      this.prisma,
      this.supabaseService,
      this.logger,
      [userId],
      'OFFER_UPDATED',
      data,
    );
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
    const payload: EscrowPushPayloadData = {
      dealId: deal.id,
      dealTitle: deal.title,
      amount: Number(deal.amount),
      currency: deal.currency,
      status: 'DEPOSITED',
      txHash: txHash ?? undefined,
    };
    dispatchEscrowPush(
      this,
      [deal.sellerId, deal.buyerId],
      'DEPOSIT_SUCCESS',
      payload,
    );
    void persistAndBroadcastUserNotifications(
      this.prisma,
      this.supabaseService,
      this.logger,
      [deal.sellerId, deal.buyerId],
      'DEPOSITED',
      payload,
    );
  }

  notifyVaultUnlocked(
    deal: {
      id: string;
      sellerId: string;
      buyerId?: string | null;
      title: string;
      inspectionDeadline?: Date | null;
    },
    vaultId: string,
  ): void {
    const payload: EscrowPushPayloadData = {
      dealId: deal.id,
      dealTitle: deal.title,
      vaultId,
      inspectionDeadline: deal.inspectionDeadline?.toISOString(),
    };
    dispatchEscrowPush(this, [deal.sellerId], 'VAULT_UNLOCKED', payload);
    void persistAndBroadcastUserNotifications(
      this.prisma,
      this.supabaseService,
      this.logger,
      [deal.sellerId, deal.buyerId],
      'VAULT_UNLOCKED',
      payload,
    );
  }

  notifyDealSettled(
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
    void persistAndBroadcastUserNotifications(
      this.prisma,
      this.supabaseService,
      this.logger,
      [deal.sellerId, deal.buyerId],
      'SETTLED',
      {
        dealId: deal.id,
        dealTitle: deal.title,
        amount: Number(deal.amount),
        currency: deal.currency,
        status: 'SETTLED',
        txHash: txHash ?? undefined,
      },
    );
  }

  notifyDisputeRaised(
    deal: {
      id: string;
      sellerId: string;
      buyerId?: string | null;
      title: string;
    },
    dispute: { id: string; reason: string },
    initiatorId: string,
  ): void {
    const recipients = [deal.sellerId, deal.buyerId].filter(
      (id): id is string => Boolean(id && id !== initiatorId),
    );
    const targets = recipients.length > 0 ? recipients : [deal.sellerId];
    void persistAndBroadcastUserNotifications(
      this.prisma,
      this.supabaseService,
      this.logger,
      targets,
      'DISPUTE_RAISED',
      {
        dealId: deal.id,
        dealTitle: deal.title,
        disputeId: dispute.id,
        reason: dispute.reason,
        status: 'DISPUTED',
      },
    );
  }
}
