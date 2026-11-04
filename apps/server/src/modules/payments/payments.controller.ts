import {
  Body,
  Controller,
  Get,
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
import { Throttle } from '@nestjs/throttler';
import { THROTTLE_CONFIG } from '../../config/throttle.config';
import { AuthGuard } from '../../common/guards/auth.guard';
import {
  CurrentUser,
  RequestUser,
} from '../../common/decorators/current-user.decorator';
import {
  CreatePaymentLinkDto,
  CreateSolanaIntentDto,
  CreateVietQrCheckoutDto,
  DepositStatusResponseDto,
  PayOSWebhookDto,
  SolanaIntentResponseDto,
  SolanaVerifyResponseDto,
  VerifySolanaDepositDto,
  VietQrCheckoutResponseDto,
} from './dto/payment.dto';
import { PaymentsService } from './payments.service';
import { VietQrService } from './services/vietqr.service';
import { SolanaDepositService } from './services/solana-deposit.service';

@ApiTags('Deposit Gateway (VietQR & Solana)')
@Controller('api/v1/payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly vietQrService: VietQrService,
    private readonly solanaDepositService: SolanaDepositService,
  ) {}

  /**
   * Generates dynamic VietQR payment link & QR code for a Deal.
   */
  @Post('vietqr/create-checkout')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Tạo link thanh toán và mã VietQR động qua PayOS cho Deal',
    description:
      'Tạo phiên nạp tiền ngân hàng nội địa, sinh mã orderCode duy nhất và ảnh VietQR chuẩn NAPAS 247 có cú pháp TPZ <dealId>.',
  })
  @ApiBody({
    type: CreateVietQrCheckoutDto,
    description: 'Thông tin Deal cần tạo link nạp tiền VietQR',
  })
  @ApiResponse({
    status: 201,
    type: VietQrCheckoutResponseDto,
    description: 'Khởi tạo link thanh toán VietQR thành công.',
  })
  @ApiResponse({
    status: 400,
    description: 'Deal không ở trạng thái PENDING hoặc thông tin không hợp lệ.',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập hoặc JWT Bearer Token không hợp lệ.',
  })
  @ApiResponse({
    status: 403,
    description: 'Người bán không thể tự nạp tiền cho sản phẩm của chính mình.',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy Deal tương ứng.',
  })
  async createVietQrCheckout(
    @Body() dto: CreateVietQrCheckoutDto,
    @CurrentUser() currentUser?: RequestUser,
  ): Promise<VietQrCheckoutResponseDto> {
    return this.vietQrService.createCheckout(dto, currentUser);
  }

  /**
   * Dedicated Webhook handler for VietQR / PayOS notifications.
   */
  @Post('vietqr/webhook')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    webhook: {
      limit: THROTTLE_CONFIG.webhookLimit,
      ttl: THROTTLE_CONFIG.webhookTtlMs,
    },
  })
  @ApiOperation({
    summary:
      'Tiếp nhận Webhook thanh toán VietQR PayOS (HMAC-SHA256 & Idempotent)',
    description:
      'Xác thực chữ ký HMAC-SHA256 PayOS, kiểm tra chống replay attack, đối soát amount >= deal.amount và chuyển Deal sang DEPOSITED.',
  })
  @ApiBody({
    type: PayOSWebhookDto,
    description: 'Payload webhook từ cổng thanh toán PayOS',
  })
  @ApiResponse({
    status: 200,
    description: 'Xác thực webhook thành công hoặc đã ghi nhận (Idempotent).',
  })
  @ApiResponse({
    status: 400,
    description:
      'Chữ ký HMAC không hợp lệ, thiếu dữ liệu hoặc số tiền thanh toán không đủ.',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy Deal tương ứng với orderCode.',
  })
  @ApiResponse({
    status: 409,
    description: 'Xung đột trạng thái giao dịch hoặc đã bị từ chối.',
  })
  @ApiResponse({
    status: 429,
    description: 'Quá giới hạn tần suất yêu cầu webhook.',
  })
  async handleVietQrWebhook(@Body() payload: PayOSWebhookDto) {
    return this.vietQrService.handleWebhook(payload);
  }

  /**
   * Creates an on-chain Solana escrow deposit session intent.
   */
  @Post('solana/create-intent')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary:
      'Khởi tạo phiên nạp tiền ký quỹ Solana (Escrow PDA / Vault Intent)',
    description:
      'Cung cấp địa chỉ ví tiếp nhận Escrow PDA, quy đổi số lượng Lamports/SOL tương ứng giá trị cọc và memo đối soát duy nhất.',
  })
  @ApiBody({
    type: CreateSolanaIntentDto,
    description: 'Thông tin Deal cần mở phiên nạp tiền Solana',
  })
  @ApiResponse({
    status: 201,
    type: SolanaIntentResponseDto,
    description: 'Tạo phiên nạp tiền Solana on-chain thành công.',
  })
  @ApiResponse({
    status: 400,
    description: 'Deal không ở trạng thái PENDING.',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực hoặc token không hợp lệ.',
  })
  @ApiResponse({
    status: 403,
    description: 'Người bán không thể tự nạp tiền ký quỹ.',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy Deal.',
  })
  async createSolanaIntent(
    @Body() dto: CreateSolanaIntentDto,
    @CurrentUser() currentUser?: RequestUser,
  ): Promise<SolanaIntentResponseDto> {
    return this.solanaDepositService.createIntent(dto, currentUser);
  }

  /**
   * Verifies an on-chain Solana transaction signature and updates Deal to DEPOSITED.
   */
  @Post('solana/verify-signature')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Xác thực giao dịch nạp tiền Solana on-chain qua TxHash (Anti-Replay)',
    description:
      'Nhận transaction signature từ client/watcher, đối soát trạng thái finalized/confirmed trên RPC, chống double-spend và kích hoạt Deal DEPOSITED.',
  })
  @ApiBody({
    type: VerifySolanaDepositDto,
    description: 'dealId và signature cần xác thực',
  })
  @ApiResponse({
    status: 200,
    type: SolanaVerifyResponseDto,
    description: 'Giao dịch on-chain hợp lệ, Deal đã chuyển sang DEPOSITED.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Không tìm thấy giao dịch on-chain hoặc giao dịch bị revert trên mạng Solana.',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy Deal.',
  })
  @ApiResponse({
    status: 409,
    description:
      'Transaction signature đã từng được sử dụng (Replay Attack / Double Spend).',
  })
  async verifySolanaSignature(
    @Body() dto: VerifySolanaDepositDto,
  ): Promise<SolanaVerifyResponseDto> {
    return this.solanaDepositService.verifySignature(dto);
  }

  /**
   * Queries latest deposit status and payment transaction details for a Deal.
   */
  @Get('deals/:dealId/deposit-status')
  @ApiOperation({
    summary: 'Tra cứu trạng thái nạp tiền mới nhất của Deal',
    description:
      'Xem trạng thái ký quỹ, kênh nạp tiền (VietQR hoặc Solana), số tiền đã cọc và TxHash / mã đơn hàng.',
  })
  @ApiParam({
    name: 'dealId',
    type: String,
    description: 'UUID của Deal cần kiểm tra trạng thái nạp tiền',
    example: 'd0000000-0000-4000-a000-000000000001',
  })
  @ApiResponse({
    status: 200,
    type: DepositStatusResponseDto,
    description: 'Thông tin trạng thái nạp tiền của Deal.',
  })
  @ApiResponse({
    status: 400,
    description: 'dealId không đúng định dạng UUID.',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy Deal tương ứng.',
  })
  async getDepositStatus(
    @Param('dealId', new ParseUUIDPipe()) dealId: string,
  ): Promise<DepositStatusResponseDto> {
    return this.solanaDepositService.getDepositStatus(dealId);
  }

  // ============================================================================
  // Zero-Regression Endpoints (Preserved for backward-compatibility & e2e suites)
  // ============================================================================

  @Post('create-link/:dealId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary:
      'Tạo link thanh toán VietQR cho Deal (Legacy REST Param format)',
  })
  @ApiParam({
    name: 'dealId',
    type: String,
    description: 'UUID của Deal',
    example: 'd0000000-0000-4000-a000-000000000001',
  })
  async createPaymentLink(
    @Param('dealId', new ParseUUIDPipe()) dealId: string,
    @Body() dto?: CreatePaymentLinkDto,
    @CurrentUser() currentUser?: RequestUser,
  ) {
    return this.paymentsService.createPaymentLink(dealId, dto, currentUser);
  }

  @Post('checkout')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Tạo link thanh toán checkout (Legacy Body format)',
  })
  async checkout(
    @Body() dto: CreatePaymentLinkDto,
    @CurrentUser() currentUser?: RequestUser,
  ) {
    if (!dto.dealId) {
      throw new Error('dealId is required in checkout body');
    }
    return this.paymentsService.createPaymentLink(dto.dealId, dto, currentUser);
  }

  @Post('simulate-success/:dealId')
  @ApiOperation({
    summary: 'Mô phỏng thanh toán VietQR thành công (Sandbox Dev mode)',
  })
  @ApiParam({
    name: 'dealId',
    type: String,
    description: 'UUID của Deal',
  })
  async simulateSuccess(@Param('dealId', new ParseUUIDPipe()) dealId: string) {
    return this.paymentsService.simulatePaymentSuccess(dealId);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    webhook: {
      limit: THROTTLE_CONFIG.webhookLimit,
      ttl: THROTTLE_CONFIG.webhookTtlMs,
    },
  })
  @ApiOperation({
    summary: 'Legacy alias: Tiếp nhận Webhook thanh toán PayOS',
  })
  async handleLegacyWebhook(@Body() payload: PayOSWebhookDto) {
    return this.paymentsService.handleWebhook(payload);
  }
}
