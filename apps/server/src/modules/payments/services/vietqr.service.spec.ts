import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DealState, OrderStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../../../database/prisma.service';
import { VietQrService } from './vietqr.service';

describe('VietQrService', () => {
  let service: VietQrService;
  const checksumKey = 'mock_checksum_key_1234567890';

  const generateSignature = (
    data: Record<string, any>,
    key: string,
  ): string => {
    const sortedKeys = Object.keys(data).sort();
    const queryParts: string[] = [];
    for (const k of sortedKeys) {
      const val = data[k];
      if (val !== undefined && val !== null) {
        queryParts.push(`${k}=${val}`);
      }
    }
    return crypto
      .createHmac('sha256', key)
      .update(queryParts.join('&'))
      .digest('hex');
  };

  const mockPrismaService = {
    deal: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    order: {
      update: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    process.env.PAYOS_CHECKSUM_KEY = checksumKey;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VietQrService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<VietQrService>(VietQrService);
    jest.clearAllMocks();
  });

  describe('createCheckout', () => {
    it('should throw NotFoundException if deal not found', async () => {
      mockPrismaService.deal.findUnique.mockResolvedValue(null);
      await expect(
        service.createCheckout({ dealId: 'non-existent' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if deal is not PENDING', async () => {
      mockPrismaService.deal.findUnique.mockResolvedValue({
        id: 'deal-1',
        state: DealState.DEPOSITED,
      });
      await expect(
        service.createCheckout({ dealId: 'deal-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should generate VietQR checkout payload and link orderCode', async () => {
      const deal = {
        id: 'd0000000-0000-4000-a000-000000000001',
        amount: 500000,
        currency: 'VND',
        state: DealState.PENDING,
        sellerId: 'seller-1',
      };
      mockPrismaService.deal.findUnique.mockResolvedValue(deal);
      mockPrismaService.deal.update.mockResolvedValue({ ...deal, paymentOrderCode: 88990011 });

      const result = await service.createCheckout({ dealId: deal.id });
      expect(result.qrCodeUrl).toBeDefined();
      expect(result.paymentUrl).toBeDefined();
      expect(result.orderCode).toBeDefined();
      expect(result.amount).toBe(500000);
      expect(result.memo).toContain('TPZ');
    });
  });

  describe('handleWebhook', () => {
    it('should reject invalid HMAC signature', async () => {
      const payload: any = {
        code: '00',
        desc: 'Success',
        data: { orderCode: 88990011, amount: 500000 },
        signature: 'invalid_signature',
      };
      await expect(service.handleWebhook(payload)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return idempotent success if webhook already processed', async () => {
      const data = {
        orderCode: 88990011,
        amount: 500000,
        reference: 'FT240926001234',
      };
      const signature = generateSignature(data, checksumKey);
      const payload: any = { code: '00', desc: 'Success', data, signature };

      mockPrismaService.deal.findFirst.mockResolvedValueOnce({
        id: 'deal-1',
        state: DealState.DEPOSITED,
      });

      const result = await service.handleWebhook(payload);
      expect(result.success).toBe(true);
      expect(result.message).toContain('idempotent');
    });

    it('should transition deal to DEPOSITED on valid webhook', async () => {
      const data = {
        orderCode: 88990011,
        amount: 500000,
        reference: 'FT240926001234',
        accountNumber: '998877',
        currency: 'VND',
        transactionDateTime: '2026-11-01 02:00:00',
      };
      const signature = generateSignature(data, checksumKey);
      const payload: any = { code: '00', desc: 'Success', data, signature };

      mockPrismaService.deal.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'deal-1',
          amount: 500000,
          currency: 'VND',
          state: DealState.PENDING,
          order: { id: 'order-1' },
        });

      mockPrismaService.deal.update.mockResolvedValue({
        id: 'deal-1',
        state: DealState.DEPOSITED,
      });
      mockPrismaService.order.update.mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.PAID_ESCROW,
      });

      const result = await service.handleWebhook(payload);
      expect(result.success).toBe(true);
      if ('deal' in result && result.deal) {
        expect(result.deal.state).toBe(DealState.DEPOSITED);
      }
    });
  });
});

