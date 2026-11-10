import { BargainStatus, DealState } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BargainsService } from './bargains.service';

describe('BargainsService Deep-Link Push Guard (TASK-c-8)', () => {
  const mockPrisma = {
    deal: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    order: {
      upsert: jest.fn(),
    },
    bargainOffer: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockNotificationsService = {
    notifyOfferUpdated: jest.fn(),
  } as unknown as NotificationsService;

  let service: BargainsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BargainsService(
      mockPrisma as unknown as PrismaService,
      undefined,
      mockNotificationsService,
    );
  });

  it('does NOT send /deal-room push when offer is only a pre-deal product inquiry (no dealId)', async () => {
    mockPrisma.product.findUnique.mockResolvedValue({
      id: 'prod-999',
      sellerId: 'seller-1',
      title: 'SaaS Boilerplate',
      status: 'ACTIVE',
      currency: 'VND',
      ruleConfig: {},
    });
    mockPrisma.bargainOffer.create.mockResolvedValue({
      id: 'offer-1',
      productId: 'prod-999',
      buyerId: 'buyer-1',
      status: BargainStatus.PENDING,
    });

    await service.create({
      productId: 'prod-999',
      buyerId: 'buyer-1',
      offeredPrice: 1200000,
    });

    expect(mockNotificationsService.notifyOfferUpdated).not.toHaveBeenCalled();
  });

  it('sends /deal-room push with verified deal.id when a real Deal exists', async () => {
    mockPrisma.deal.findUnique.mockResolvedValue({
      id: 'deal-real-123',
      sellerId: 'seller-1',
      buyerId: 'buyer-1',
      title: 'Escrow Deal',
      amount: 2000000,
      state: DealState.PENDING,
      order: { productId: 'prod-123' },
    });
    mockPrisma.product.findUnique.mockResolvedValue({
      id: 'prod-123',
      sellerId: 'seller-1',
      title: 'Escrow Deal Asset',
      status: 'ACTIVE',
      currency: 'VND',
      ruleConfig: {},
    });
    mockPrisma.bargainOffer.create.mockResolvedValue({
      id: 'offer-2',
      productId: 'prod-123',
      buyerId: 'buyer-1',
      status: BargainStatus.PENDING,
    });

    await service.create({
      dealId: 'deal-real-123',
      buyerId: 'buyer-1',
      offeredPrice: 1800000,
    });

    expect(mockNotificationsService.notifyOfferUpdated).toHaveBeenCalledTimes(
      1,
    );
    expect(mockNotificationsService.notifyOfferUpdated).toHaveBeenCalledWith(
      'seller-1',
      expect.objectContaining({
        dealId: 'deal-real-123',
        price: 1800000,
      }),
    );
  });
});
