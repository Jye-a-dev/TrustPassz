import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { DevicePlatform } from '@prisma/client';
import type { Messaging, MulticastMessage } from 'firebase-admin/messaging';
import { RequestUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../database/prisma.service';
import { JwtService } from '../auth/jwt.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsService & NotificationsController (TASK-c-8)', () => {
  let service: NotificationsService;
  let controller: NotificationsController;

  const mockDeviceTokenDelegate = {
    upsert: jest.fn(),
    deleteMany: jest.fn(),
    findMany: jest.fn(),
  };

  const mockPrisma = {
    deviceToken: mockDeviceTokenDelegate,
    deal: { findMany: jest.fn().mockResolvedValue([]) },
    disputeLog: { findMany: jest.fn().mockResolvedValue([]) },
    emergencyDispatchLog: { findMany: jest.fn().mockResolvedValue([]) },
  } as unknown as PrismaService;

  const mockSendEachForMulticast = jest.fn();
  const mockMessaging = {
    sendEachForMulticast: mockSendEachForMulticast,
  } as unknown as Messaging;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationsService(mockPrisma, new ConfigService());
    service.setMessagingClientForTest(mockMessaging);
    controller = new NotificationsController(service);
  });

  it('upserts FCM token into Prisma device_tokens bound to authenticated userId', async () => {
    const now = new Date('2026-11-10T12:00:00.000Z');
    mockDeviceTokenDelegate.upsert.mockResolvedValue({
      id: 'tok-uuid-1',
      userId: 'user-111',
      token: 'fcm_android_token_abc',
      platform: DevicePlatform.ANDROID,
      updatedAt: now,
    });

    const res = await controller.registerToken('user-111', {
      token: 'fcm_android_token_abc',
      platform: 'android',
      deviceModel: 'Pixel 8',
      appVersion: '1.0.0',
    });

    expect(mockDeviceTokenDelegate.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { token: 'fcm_android_token_abc' },
        update: expect.objectContaining({
          userId: 'user-111',
          platform: DevicePlatform.ANDROID,
          isActive: true,
        }),
        create: expect.objectContaining({
          userId: 'user-111',
          token: 'fcm_android_token_abc',
          platform: DevicePlatform.ANDROID,
        }),
      }),
    );
    expect(res).toEqual({
      success: true,
      registeredAt: now.toISOString(),
      platform: 'android',
    });
  });

  it('revokes FCM token strictly scoped to authenticated userId on logout', async () => {
    mockDeviceTokenDelegate.deleteMany.mockResolvedValue({ count: 1 });

    const res = await controller.deleteToken('user-111', {
      token: 'fcm_ios_token_xyz',
    });

    expect(mockDeviceTokenDelegate.deleteMany).toHaveBeenCalledWith({
      where: {
        token: 'fcm_ios_token_xyz',
        userId: 'user-111',
      },
    });
    expect(res).toEqual({ success: true, revokedCount: 1 });
  });

  it('dispatches DEPOSIT_SUCCESS with Android high priority and APNs content-available=1', async () => {
    mockDeviceTokenDelegate.findMany.mockResolvedValue([
      { token: 'tok_android_1' },
      { token: 'tok_ios_1' },
    ]);
    mockSendEachForMulticast.mockResolvedValue({
      successCount: 2,
      failureCount: 0,
      responses: [{ success: true }, { success: true }],
    });

    const result = await service.sendEscrowPushNotification(
      'user-seller-1',
      'DEPOSIT_SUCCESS',
      {
        dealId: 'd798a623-289b-4467-bc18-2e21b711a19f',
        dealTitle: 'Cloud Enterprise Tier 3',
        amount: 5000000,
        currency: 'VND',
        status: 'DEPOSITED',
        txHash: '0x9812f8a4',
      },
    );

    expect(mockSendEachForMulticast).toHaveBeenCalledTimes(1);
    const payload = mockSendEachForMulticast.mock
      .calls[0][0] as MulticastMessage;
    expect(payload.tokens).toEqual(['tok_android_1', 'tok_ios_1']);
    expect(payload.android?.priority).toBe('high');
    expect(payload.android?.notification?.channelId).toBe(
      'trustpassz_escrow_alerts',
    );
    expect(payload.android?.notification?.color).toBe('#10B981');
    expect(payload.apns?.payload?.aps?.contentAvailable).toBe(true);
    expect(payload.data?.type).toBe('DEPOSIT_SUCCESS');
    expect(payload.data?.route).toBe('/deal-room');
    expect(result.sent).toBe(2);
    expect(result.failed).toBe(0);
  });

  it('dispatches VAULT_UNLOCKED to /vault route and cleans up unregistered tokens', async () => {
    mockDeviceTokenDelegate.findMany.mockResolvedValue([
      { token: 'tok_valid' },
      { token: 'tok_stale' },
    ]);
    mockSendEachForMulticast.mockResolvedValue({
      successCount: 1,
      failureCount: 1,
      responses: [
        { success: true },
        {
          success: false,
          error: { code: 'messaging/registration-token-not-registered' },
        },
      ],
    });
    mockDeviceTokenDelegate.deleteMany.mockResolvedValue({ count: 1 });

    const result = await service.sendEscrowPushNotification(
      'user-seller-2',
      'VAULT_UNLOCKED',
      {
        dealId: 'deal-vault-999',
        vaultId: 'vlt_8921bca9104',
        inspectionDeadline: '2026-11-12T16:30:00.000Z',
      },
    );

    const payload = mockSendEachForMulticast.mock
      .calls[0][0] as MulticastMessage;
    expect(payload.data?.route).toBe('/vault');
    expect(payload.data?.vaultId).toBe('vlt_8921bca9104');
    expect(mockDeviceTokenDelegate.deleteMany).toHaveBeenCalledWith({
      where: { token: { in: ['tok_stale'] } },
    });
    expect(result.sent).toBe(1);
    expect(result.revokedTokens).toBe(1);
  });

  it('JwtAuthGuard rejects unauthenticated requests and attaches RequestUser for valid Bearer JWT', async () => {
    const mockJwtService = {
      verifyAsync: jest.fn(),
    } as unknown as JwtService;
    const guard = new JwtAuthGuard(mockJwtService, new Reflector());

    const makeContext = (authHeader?: string): ExecutionContext => {
      const req: { headers: Record<string, string>; user?: RequestUser } = {
        headers: authHeader ? { authorization: authHeader } : {},
      };
      return {
        getHandler: () => () => undefined,
        getClass: () => NotificationsController,
        switchToHttp: () => ({
          getRequest: () => req,
        }),
      } as unknown as ExecutionContext;
    };

    await expect(guard.canActivate(makeContext())).rejects.toThrow(
      UnauthorizedException,
    );

    (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 'user-jwt-99',
      email: 'buyer@trustpassz.io',
      role: 'USER',
    });

    const authedCtx = makeContext('Bearer valid.jwt.token');
    await expect(guard.canActivate(authedCtx)).resolves.toBe(true);
    const req = authedCtx.switchToHttp().getRequest<{ user?: RequestUser }>();
    expect(req.user?.id).toBe('user-jwt-99');
  });
});
