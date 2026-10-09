import { Test, TestingModule } from '@nestjs/testing';
import { WebhookController } from './webhook.controller';
import { PaymentsService } from './payments.service';
import { PayOSWebhookDto } from './dto/payment.dto';

describe('WebhookController', () => {
  let controller: WebhookController;

  const mockPaymentsService = {
    handleWebhook: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
      ],
    }).compile();

    controller = module.get<WebhookController>(WebhookController);
    jest.clearAllMocks();
  });

  describe('handleWebhook', () => {
    it('should delegate to paymentsService.handleWebhook', async () => {
      const payload: PayOSWebhookDto = {
        code: '00',
        desc: 'Success',
        data: {
          orderCode: 88990011,
          amount: 100000,
          description: 'Payment',
          accountNumber: '123',
          reference: 'ref',
          transactionDateTime: '2026-10-09',
          currency: 'VND',
          paymentLinkId: 'link_1',
          code: '00',
          desc: 'Success',
          virtualAccountNumber: 'va_1',
        },
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
