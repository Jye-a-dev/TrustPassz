import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DealState, OrderStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: PrismaService;

  const checksumKey = 'mock_checksum_key_1234567890';

  const generateSignature = (data: Record<string, any>, key: string): string => {
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
        PaymentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('createPaymentLink', () => {
    const dealId = 'd0000000-0000-4000-a000-000000000001';

    it('should throw NotFoundException if deal does not exist', async () => {
      mockPrismaService.deal.findUnique.mockResolvedValue(null);

      await expect(service.createPaymentLink(dealId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if deal is not in PENDING state', async () => {
      mockPrismaService.deal.findUnique.mockResolvedValue({
        id: dealId,
        state: DealState.DEPOSITED,
        amount: 500000,
      });

      await expect(service.createPaymentLink(dealId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create payment link and persist paymentOrderCode in Deal', async () => {
      mockPrismaService.deal.findUnique.mockResolvedValue({
        id: dealId,
        state: DealState.PENDING,
        amount: 500000,
        currency: 'VND',
        order: null,
      });

      mockPrismaService.deal.update.mockResolvedValue({
        id: dealId,
        paymentOrderCode: BigInt(88990011),
      });

      const result = await service.createPaymentLink(dealId);

      expect(result).toHaveProperty('orderCode');
      expect(result).toHaveProperty('checkoutUrl');
      expect(result).toHaveProperty('qrCode');
      expect(result.amount).toBe(500000);
      expect(mockPrismaService.deal.update).toHaveBeenCalled();
    });
  });

  describe('handleWebhook', () => {
    const validWebhookData = {
      orderCode: 88990011,
      amount: 500000,
      description: 'Deal Escrow Payment',
      accountNumber: '998877',
      reference: 'FT240926001234',
      transactionDateTime: '2026-09-26 14:30:00',
      currency: 'VND',
      paymentLinkId: 'pl_88990011',
      code: '00',
      desc: 'Success',
    };

    it('should throw BadRequestException if signature is invalid', async () => {
      const payload = {
        code: '00',
        desc: 'Success',
        success: true,
        data: validWebhookData,
        signature: 'invalid_tampered_signature_hash',
      };

      await expect(service.handleWebhook(payload as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return 200 idempotent response if webhook was already processed', async () => {
      const signature = generateSignature(validWebhookData, checksumKey);
      const payload = {
        code: '00',
        desc: 'Success',
        success: true,
        data: validWebhookData,
        signature,
      };

      // Mock existing deal with this idempotency key
      mockPrismaService.deal.findFirst.mockResolvedValueOnce({
        id: 'd0000000-0000-4000-a000-000000000001',
        state: DealState.DEPOSITED,
        webhookIdempotencyKey: validWebhookData.reference,
      });

      const response = await service.handleWebhook(payload as any);

      expect(response.success).toBe(true);
      expect(response.message).toContain('idempotent');
      expect(mockPrismaService.deal.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if orderCode does not match any Deal', async () => {
      const signature = generateSignature(validWebhookData, checksumKey);
      const payload = {
        code: '00',
        desc: 'Success',
        success: true,
        data: validWebhookData,
        signature,
      };

      // No idempotency hit
      mockPrismaService.deal.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      await expect(service.handleWebhook(payload as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if amount is underpaid', async () => {
      const signature = generateSignature(validWebhookData, checksumKey);
      const payload = {
        code: '00',
        desc: 'Success',
        success: true,
        data: validWebhookData,
        signature,
      };

      mockPrismaService.deal.findFirst
        .mockResolvedValueOnce(null) // idempotency check
        .mockResolvedValueOnce({
          id: 'd0000000-0000-4000-a000-000000000001',
          state: DealState.PENDING,
          amount: 600000, // expected 600k but received 500k
          currency: 'VND',
        });

      await expect(service.handleWebhook(payload as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should atomically transition Deal to DEPOSITED and Order to PAID_ESCROW on valid payment', async () => {
      const signature = generateSignature(validWebhookData, checksumKey);
      const payload = {
        code: '00',
        desc: 'Success',
        success: true,
        data: validWebhookData,
        signature,
      };

      const mockDeal = {
        id: 'd0000000-0000-4000-a000-000000000001',
        state: DealState.PENDING,
        amount: 500000,
        currency: 'VND',
        inspectionDuration: 86400,
        order: {
          id: 'o0000000-0000-4000-a000-000000000001',
          status: OrderStatus.PENDING_PAYMENT,
        },
      };

      mockPrismaService.deal.findFirst
        .mockResolvedValueOnce(null) // idempotency check
        .mockResolvedValueOnce(mockDeal); // target deal find

      mockPrismaService.deal.update.mockResolvedValueOnce({
        ...mockDeal,
        state: DealState.DEPOSITED,
        depositedAt: new Date(),
        webhookIdempotencyKey: validWebhookData.reference,
        paymentRefId: validWebhookData.reference,
      });

      mockPrismaService.order.update.mockResolvedValueOnce({
        id: mockDeal.order.id,
        status: OrderStatus.PAID_ESCROW,
      });

      const response = await service.handleWebhook(payload as any);

      expect(response.success).toBe(true);
      expect(response.deal.state).toBe(DealState.DEPOSITED);
      expect(mockPrismaService.deal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockDeal.id },
          data: expect.objectContaining({
            state: DealState.DEPOSITED,
            paymentRefId: validWebhookData.reference,
          }),
        }),
      );
      expect(mockPrismaService.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockDeal.order.id },
          data: expect.objectContaining({
            status: OrderStatus.PAID_ESCROW,
          }),
        }),
      );
    });
  });
});
