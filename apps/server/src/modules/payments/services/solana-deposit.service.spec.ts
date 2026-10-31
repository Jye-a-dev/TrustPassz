import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DealState, OrderStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { SolanaDepositService } from './solana-deposit.service';

describe('SolanaDepositService', () => {
  let service: SolanaDepositService;

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
    process.env.SOLANA_MOCK_VERIFY = 'true';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SolanaDepositService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SolanaDepositService>(SolanaDepositService);
    jest.clearAllMocks();
  });

  describe('createIntent', () => {
    it('should throw NotFoundException if deal does not exist', async () => {
      mockPrismaService.deal.findUnique.mockResolvedValue(null);
      await expect(
        service.createIntent({ dealId: 'non-existent' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if deal is not PENDING', async () => {
      mockPrismaService.deal.findUnique.mockResolvedValue({
        id: 'deal-1',
        state: DealState.DEPOSITED,
      });
      await expect(
        service.createIntent({ dealId: 'deal-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should generate valid Solana intent for SOL currency', async () => {
      const deal = {
        id: 'd0000000-0000-4000-a000-000000000001',
        amount: 0.5,
        currency: 'SOL',
        state: DealState.PENDING,
        solanaPdaAddress: 'CustomPda11111111111111111111111111111111',
      };
      mockPrismaService.deal.findUnique.mockResolvedValue(deal);
      mockPrismaService.deal.update.mockResolvedValue(deal);

      const result = await service.createIntent({ dealId: deal.id });
      expect(result.recipientAddress).toBe(deal.solanaPdaAddress);
      expect(result.requiredSol).toBe(0.5);
      expect(result.requiredLamports).toBe('500000000');
      expect(result.referenceMemo).toBe(`TPZ-SOL-${deal.id}`);
      expect(result.expiresAt).toBeDefined();
    });
  });

  describe('verifySignature', () => {
    const validSig =
      '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9dTeUMnjp5nhEDXejP8M47pXmGFnnU2L8w9C57X33sB4qD';

    it('should throw ConflictException on double-spend (different deal already used signature)', async () => {
      mockPrismaService.deal.findFirst.mockResolvedValue({
        id: 'other-deal',
        state: DealState.DEPOSITED,
      });

      await expect(
        service.verifySignature({
          dealId: 'current-deal',
          signature: validSig,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should atomically transition deal to DEPOSITED on valid signature', async () => {
      const dealId = 'd0000000-0000-4000-a000-000000000001';
      mockPrismaService.deal.findFirst.mockResolvedValue(null);
      mockPrismaService.deal.findUnique.mockResolvedValue({
        id: dealId,
        state: DealState.PENDING,
        amount: 0.1,
        currency: 'SOL',
        order: { id: 'order-1' },
      });

      // Mock RPC call to prevent network timeout
      jest
        .spyOn((service as any).connection, 'getParsedTransaction')
        .mockResolvedValue({
          slot: 1234567,
          meta: { err: null },
          transaction: { message: { accountKeys: [] } },
        } as any);

      mockPrismaService.deal.update.mockResolvedValue({
        id: dealId,
        state: DealState.DEPOSITED,
      });
      mockPrismaService.order.update.mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.PAID_ESCROW,
      });

      const result = await service.verifySignature({
        dealId,
        signature: validSig,
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('DEPOSITED');
      expect(result.txHash).toBe(validSig);
    });
  });

  describe('getDepositStatus', () => {
    it('should return correct deposit status for a deal', async () => {
      const dealId = 'd0000000-0000-4000-a000-000000000001';
      mockPrismaService.deal.findUnique.mockResolvedValue({
        id: dealId,
        state: DealState.DEPOSITED,
        currency: 'SOL',
        amount: 0.1,
        depositedAt: new Date('2026-11-01T02:00:00Z'),
        depositTxHash: 'some_sig',
        paymentOrderCode: null,
        paymentRefId: `TPZ-SOL-${dealId}`,
        solanaPdaAddress: 'PdaAddress1111',
      });

      const result = await service.getDepositStatus(dealId);
      expect(result.dealId).toBe(dealId);
      expect(result.state).toBe('DEPOSITED');
      expect(result.channel).toBe('SOLANA');
      expect(result.depositTxHash).toBe('some_sig');
    });
  });
});
