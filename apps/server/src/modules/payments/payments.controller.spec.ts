import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '../../common/guards/auth.guard';
import { JwtService } from '../auth/jwt.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { VietQrService } from './services/vietqr.service';
import { SolanaDepositService } from './services/solana-deposit.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let mockPaymentsService: any;
  let mockVietQrService: any;
  let mockSolanaDepositService: any;

  beforeEach(async () => {
    mockPaymentsService = {
      createPaymentLink: jest.fn(),
      handleWebhook: jest.fn(),
      simulatePaymentSuccess: jest.fn(),
    };

    mockVietQrService = {
      createCheckout: jest.fn(),
      handleWebhook: jest.fn(),
    };

    mockSolanaDepositService = {
      createIntent: jest.fn(),
      verifySignature: jest.fn(),
      getDepositStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
        {
          provide: VietQrService,
          useValue: mockVietQrService,
        },
        {
          provide: SolanaDepositService,
          useValue: mockSolanaDepositService,
        },
        {
          provide: JwtService,
          useValue: { verifyAsync: jest.fn() },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PaymentsController>(PaymentsController);
    jest.clearAllMocks();
  });

  describe('createVietQrCheckout', () => {
    it('should delegate to vietQrService.createCheckout', async () => {
      const dto = { dealId: 'd0000000-0000-4000-a000-000000000001' };
      const expected = {
        qrCodeUrl: 'https://img.vietqr.io/image/970422-998877-compact2.png',
        paymentUrl: 'https://pay.payos.vn/web/88990011',
        orderCode: 88990011,
        amount: 500000,
        memo: 'TPZ d0000000',
      };
      mockVietQrService.createCheckout.mockResolvedValue(expected);

      const result = await controller.createVietQrCheckout(dto, undefined);
      expect(result).toBe(expected);
      expect(mockVietQrService.createCheckout).toHaveBeenCalledWith(
        dto,
        undefined,
      );
    });
  });

  describe('handleVietQrWebhook', () => {
    it('should delegate to vietQrService.handleWebhook', async () => {
      const payload: any = {
        code: '00',
        desc: 'Success',
        data: { orderCode: 88990011, amount: 500000 },
        signature: 'valid_sig',
      };
      const expected = { success: true, message: 'Verified' };
      mockVietQrService.handleWebhook.mockResolvedValue(expected);

      const result = await controller.handleVietQrWebhook(payload);
      expect(result).toBe(expected);
      expect(mockVietQrService.handleWebhook).toHaveBeenCalledWith(payload);
    });
  });

  describe('createSolanaIntent', () => {
    it('should delegate to solanaDepositService.createIntent', async () => {
      const dto = { dealId: 'd0000000-0000-4000-a000-000000000001' };
      const expected = {
        recipientAddress: 'TrUsTEscrow111111111111111111111111111111111',
        requiredSol: 0.05,
        requiredLamports: '50000000',
        referenceMemo: 'TPZ-SOL-d0000000-0000-4000-a000-000000000001',
        expiresAt: '2026-11-01T02:30:00.000Z',
      };
      mockSolanaDepositService.createIntent.mockResolvedValue(expected);

      const result = await controller.createSolanaIntent(dto, undefined);
      expect(result).toBe(expected);
      expect(mockSolanaDepositService.createIntent).toHaveBeenCalledWith(
        dto,
        undefined,
      );
    });
  });

  describe('verifySolanaSignature', () => {
    it('should delegate to solanaDepositService.verifySignature', async () => {
      const dto = {
        dealId: 'd0000000-0000-4000-a000-000000000001',
        signature: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9dTeUMnjp5nhEDXejP8M47pXmGFnnU2L8w9C57X33sB4qD',
      };
      const expected = {
        success: true,
        txHash: dto.signature,
        status: 'DEPOSITED',
        confirmedAt: '2026-11-01T02:05:00.000Z',
      };
      mockSolanaDepositService.verifySignature.mockResolvedValue(expected);

      const result = await controller.verifySolanaSignature(dto);
      expect(result).toBe(expected);
      expect(mockSolanaDepositService.verifySignature).toHaveBeenCalledWith(dto);
    });
  });

  describe('getDepositStatus', () => {
    it('should delegate to solanaDepositService.getDepositStatus', async () => {
      const dealId = 'd0000000-0000-4000-a000-000000000001';
      const expected = {
        dealId,
        state: 'DEPOSITED',
        currency: 'VND',
        amount: 500000,
        depositedAt: '2026-11-01T02:05:00.000Z',
        depositTxHash: null,
        paymentOrderCode: 88990011,
        paymentRefId: 'FT240926001234',
        channel: 'VIETQR',
        solanaPdaAddress: null,
      };
      mockSolanaDepositService.getDepositStatus.mockResolvedValue(expected);

      const result = await controller.getDepositStatus(dealId);
      expect(result).toBe(expected);
      expect(mockSolanaDepositService.getDepositStatus).toHaveBeenCalledWith(
        dealId,
      );
    });
  });

  describe('createPaymentLink (Legacy)', () => {
    it('should delegate to paymentsService.createPaymentLink', async () => {
      const dealId = 'd0000000-0000-4000-a000-000000000001';
      const expected = {
        dealId,
        orderCode: 88990011,
        checkoutUrl: 'https://pay.payos.vn/web/88990011',
      };
      mockPaymentsService.createPaymentLink.mockResolvedValue(expected);

      const result = await controller.createPaymentLink(dealId, {});
      expect(result).toBe(expected);
      expect(mockPaymentsService.createPaymentLink).toHaveBeenCalledWith(
        dealId,
        {},
        undefined,
      );
    });
  });
});
