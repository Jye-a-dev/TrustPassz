import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import {
  CreatePaymentLinkDto,
  PayOSWebhookDto,
} from './dto/payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments & Payment Gateway Webhooks')
@Controller('api/v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Generates dynamic VietQR payment link for a Deal via PayOS.
   */
  @Post('create-link/:dealId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Tạo link thanh toán VietQR động qua PayOS cho Deal',
    description:
      'Sinh mã đơn hàng orderCode duy nhất, gọi SDK PayOS tạo VietQR động kèm checkout URL, liên kết orderCode vào Deal trong DB.',
  })
  @ApiParam({
    name: 'dealId',
    type: String,
    description: 'UUID của Deal cần thanh toán đặt cọc Escrow',
    example: 'd0000000-0000-4000-a000-000000000001',
  })
  @ApiBody({
    type: CreatePaymentLinkDto,
    required: false,
    description: 'Tùy chọn cấu hình URL chuyển hướng và nội dung chuyển khoản',
  })
  @ApiResponse({
    status: 201,
    description: 'Tạo link thanh toán VietQR thành công.',
    schema: {
      example: {
        dealId: 'd0000000-0000-4000-a000-000000000001',
        orderCode: 88990011,
        amount: 500000,
        currency: 'VND',
        description: 'Deal d0000000',
        bin: '970422',
        accountNumber: '998877',
        accountName: 'TRUSTPASSZ ESCROW',
        checkoutUrl: 'https://pay.payos.vn/web/88990011',
        qrCode:
          'vietqr://pay?acc=998877&bin=970422&amount=500000&memo=88990011',
        paymentLinkId: 'pl_88990011',
        status: 'PENDING',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Deal không ở trạng thái PENDING hoặc thông tin thanh toán không hợp lệ.',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực hoặc token JWT không hợp lệ.',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy Deal tương ứng với dealId.',
  })
  async createPaymentLink(
    @Param('dealId', new ParseUUIDPipe()) dealId: string,
    @Body() dto?: CreatePaymentLinkDto,
  ) {
    return this.paymentsService.createPaymentLink(dealId, dto);
  }

  /**
   * Legacy / Alternate checkout endpoint supporting dealId in request body.
   */
  @Post('checkout')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Tạo link thanh toán checkout (Body Payload format)',
    description:
      'Hỗ trợ tạo link thanh toán khi truyền dealId qua JSON body thay vì URL param.',
  })
  @ApiResponse({ status: 201, description: 'Tạo payment link thành công.' })
  @ApiResponse({ status: 400, description: 'Thiếu dealId hoặc trạng thái không hợp lệ.' })
  async checkout(@Body() dto: CreatePaymentLinkDto) {
    if (!dto.dealId) {
      throw new Error('dealId is required in checkout body');
    }
    return this.paymentsService.createPaymentLink(dto.dealId, dto);
  }

  /**
   * Receives payment notification webhooks from PayOS.
   * Public endpoint bypassing AuthGuard, strictly protected by HMAC-SHA256 checksum and Idempotency key.
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Tiếp nhận Webhook thanh toán PayOS (HMAC-SHA256 & Idempotent)',
    description:
      'Xác thực chữ ký HMAC-SHA256 PayOS, kiểm tra chống tấn công Replay Attack (Idempotency), validate số tiền và chuyển trạng thái Deal sang DEPOSITED trong transaction ACID.',
  })
  @ApiBody({
    type: PayOSWebhookDto,
    description: 'Payload webhook từ cổng thanh toán PayOS',
    examples: {
      vietqr_success: {
        summary: 'PayOS Webhook thanh toán thành công (Signature hợp lệ)',
        value: {
          code: '00',
          desc: 'Success',
          success: true,
          data: {
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
            counterAccountBankId: '970422',
            counterAccountBankName: 'MBBank',
            counterAccountName: 'NGUYEN VAN A',
            counterAccountNumber: '0123456789',
          },
          signature:
            'c131d9430f59fced8551be1b4c818738a90b310a875f08d232787a4b7e1c7cf6',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Xử lý webhook thành công hoặc giao dịch đã ghi nhận (Idempotent).',
    schema: {
      example: {
        success: true,
        message: 'Payment verified and deal successfully transitioned to DEPOSITED',
        deal: {
          id: 'd0000000-0000-4000-a000-000000000001',
          state: 'DEPOSITED',
          depositedAt: '2026-09-26T07:30:00.000Z',
          paymentRefId: 'FT240926001234',
          webhookIdempotencyKey: 'FT240926001234',
        },
      },
    },
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
  async handleWebhook(@Body() payload: PayOSWebhookDto) {
    return this.paymentsService.handleWebhook(payload);
  }
}
