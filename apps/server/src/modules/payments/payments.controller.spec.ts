import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '../../common/guards/auth.guard';
import { JwtService } from '../auth/jwt.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: PaymentsService;

  const mockPaymentsService = {
    createPaymentLink: jest.fn(),
    handleWebhook: jest.fn(),
  };

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PaymentsController>(PaymentsController);
    service = module.get<PaymentsService>(PaymentsService);
    jest.clearAllMocks();
  });

  describe('createPaymentLink', () => {
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
      );
    });
  });

  describe('handleWebhook', () => {
    it('should delegate to paymentsService.handleWebhook', async () => {
      const payload: any = {
        code: '00',
        desc: 'Success',
        data: { orderCode: 88990011 },
        signature: 'valid_signature',
      };
      const expected = { success: true, message: 'Processed' };
      mockPaymentsService.handleWebhook.mockResolvedValue(expected);

      const result = await controller.handleWebhook(payload);
      expect(result).toBe(expected);
      expect(mockPaymentsService.handleWebhook).toHaveBeenCalledWith(payload);
    });
  });
});
