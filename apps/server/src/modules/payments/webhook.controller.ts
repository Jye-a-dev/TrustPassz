import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { THROTTLE_CONFIG } from '../../config/throttle.config';
import { PayOSWebhookDto } from './dto/payment.dto';
import { PaymentsService } from './payments.service';

/**
 * WebhookController — Dedicated controller for PayOS Webhook ingestion (TASK-a-10).
 * Protected by:
 *   1. Differentiated Throttler rate limiter (THROTTLE_WEBHOOK_LIMIT / THROTTLE_WEBHOOK_TTL)
 *   2. HMAC-SHA256 checksum verification
 *   3. ACID transaction idempotency key deduplication
 */
@ApiTags('Payments & Payment Gateway Webhooks')
@Controller('api/v1/payments')
export class WebhookController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    webhook: {
      limit: THROTTLE_CONFIG.webhookLimit,
      ttl: THROTTLE_CONFIG.webhookTtlMs,
    },
  })
  @ApiOperation({
    summary: 'Tiếp nhận Webhook thanh toán PayOS (HMAC-SHA256 & Idempotent)',
    description:
      'Xác thực chữ ký HMAC-SHA256 PayOS, kiểm tra chống tấn công Replay Attack (Idempotency), validate số tiền và chuyển trạng thái Deal sang DEPOSITED trong transaction ACID.',
  })
  @ApiBody({
    type: PayOSWebhookDto,
    description: 'Payload webhook từ cổng thanh toán PayOS',
  })
  @ApiResponse({
    status: 200,
    description:
      'Xử lý webhook thành công hoặc giao dịch đã ghi nhận (Idempotent).',
  })
  @ApiResponse({
    status: 400,
    description:
      'Chữ ký HMAC không hợp lệ, payload sai định dạng hoặc số tiền thanh toán không khớp.',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy Deal tương ứng với orderCode từ PayOS.',
  })
  @ApiResponse({
    status: 429,
    description: 'Too Many Requests — Rate limit exceeded on webhook.',
  })
  async handleWebhook(@Body() payload: PayOSWebhookDto) {
    return this.paymentsService.handleWebhook(payload);
  }
}

