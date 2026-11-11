import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { SupabaseService } from '../../integrations/supabase/supabase.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('User In-App Notifications & Realtime Persistence (TASK-c-9)', () => {
  let service: NotificationsService;
  let controller: NotificationsController;

  const mockNotificationDelegate = {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  };

  const mockPrisma = {
    notification: mockNotificationDelegate,
    deviceToken: {
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
  } as unknown as PrismaService;

  const mockSupabaseService = {
    broadcastUserNotification: jest.fn().mockResolvedValue(undefined),
  } as unknown as SupabaseService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationsService(
      mockPrisma,
      new ConfigService(),
      mockSupabaseService,
    );
    controller = new NotificationsController(service);
  });

  it('lists paginated notifications with unreadCount scoped to current user', async () => {
    const now = new Date('2026-11-11T10:00:00.000Z');
    mockNotificationDelegate.findMany.mockResolvedValue([
      {
        id: 'notif-1',
        userId: 'user-1',
        type: 'DEPOSITED',
        title: 'Tiền cọc VietQR đã được khóa',
        message: 'Giao dịch đã khóa cọc',
        data: { dealId: 'deal-1', route: '/user/deals/deal-1' },
        isRead: false,
        createdAt: now,
      },
    ]);
    mockNotificationDelegate.count
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);

    const res = await controller.getUserNotifications('user-1', {
      limit: 10,
      offset: 0,
    });

    expect(mockNotificationDelegate.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      skip: 0,
    });
    expect(res.unreadCount).toBe(1);
    expect(res.total).toBe(1);
    expect(res.items).toHaveLength(1);
    expect(res.items[0]?.id).toBe('notif-1');
  });

  it('marks a notification as read when owned by user and throws NotFoundException otherwise', async () => {
    const now = new Date('2026-11-11T10:00:00.000Z');
    mockNotificationDelegate.findFirst.mockResolvedValueOnce({
      id: 'notif-uuid-1',
      userId: 'user-1',
      type: 'OFFER_UPDATED',
      title: 'Đề xuất giá mới',
      message: '1.500.000 đ',
      data: { dealId: 'deal-1' },
      isRead: false,
      createdAt: now,
    });
    mockNotificationDelegate.update.mockResolvedValueOnce({
      id: 'notif-uuid-1',
      userId: 'user-1',
      type: 'OFFER_UPDATED',
      title: 'Đề xuất giá mới',
      message: '1.500.000 đ',
      data: { dealId: 'deal-1' },
      isRead: true,
      createdAt: now,
    });
    mockNotificationDelegate.count.mockResolvedValueOnce(2);

    const result = await controller.markAsRead('user-1', 'notif-uuid-1');
    expect(result.success).toBe(true);
    expect(result.notification.isRead).toBe(true);
    expect(result.unreadCount).toBe(2);

    mockNotificationDelegate.findFirst.mockResolvedValueOnce(null);
    await expect(
      controller.markAsRead('user-other', 'notif-uuid-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('marks all unread notifications for the authenticated user as read', async () => {
    mockNotificationDelegate.updateMany.mockResolvedValue({ count: 5 });

    const result = await controller.markAllAsRead('user-1');

    expect(mockNotificationDelegate.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', isRead: false },
      data: { isRead: true },
    });
    expect(result).toEqual({
      success: true,
      updatedCount: 5,
      unreadCount: 0,
    });
  });

  it('persists Notification and broadcasts via Supabase on deposit, vault unlock, settle, and dispute', async () => {
    const createdAt = new Date('2026-11-11T11:00:00.000Z');
    mockNotificationDelegate.create.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        id: `id-${String(data.userId)}-${String(data.type)}`,
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
        isRead: false,
        createdAt,
      }),
    );

    service.notifyDepositSuccess(
      {
        id: 'deal-99',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        title: 'SaaS Kit',
        amount: 2500000,
        currency: 'VND',
      },
      'ref_123',
    );
    await new Promise((r) => setTimeout(r, 20));

    expect(mockSupabaseService.broadcastUserNotification).toHaveBeenCalledWith(
      'seller-1',
      expect.objectContaining({ type: 'DEPOSITED', isRead: false }),
    );
    expect(mockSupabaseService.broadcastUserNotification).toHaveBeenCalledWith(
      'buyer-1',
      expect.objectContaining({ type: 'DEPOSITED', isRead: false }),
    );

    service.notifyVaultUnlocked(
      {
        id: 'deal-99',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        title: 'SaaS Kit',
      },
      'vault-1',
    );
    await new Promise((r) => setTimeout(r, 20));

    expect(mockSupabaseService.broadcastUserNotification).toHaveBeenCalledWith(
      'seller-1',
      expect.objectContaining({ type: 'VAULT_UNLOCKED' }),
    );

    service.notifyDisputeRaised(
      {
        id: 'deal-99',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        title: 'SaaS Kit',
      },
      { id: 'disp-1', reason: 'License key mismatch' },
      'buyer-1',
    );
    await new Promise((r) => setTimeout(r, 20));

    expect(mockSupabaseService.broadcastUserNotification).toHaveBeenCalledWith(
      'seller-1',
      expect.objectContaining({ type: 'DISPUTE_RAISED' }),
    );
  });
});
