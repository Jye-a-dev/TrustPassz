import {
  Body,
  Controller,
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
  CurrentUser,
  RequestUser,
} from '../../common/decorators/current-user.decorator';
import { CreatePaymentLinkDto } from './dto/payment.dto';
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
    status: 403,
    description:
      'Người bán không thể tự mua hoặc thanh toán sản phẩm của chính mình.',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy Deal tương ứng với dealId.',
  })
  async createPaymentLink(
    @Param('dealId', new ParseUUIDPipe()) dealId: string,
    @Body() dto?: CreatePaymentLinkDto,
    @CurrentUser() currentUser?: RequestUser,
  ) {
    return this.paymentsService.createPaymentLink(dealId, dto, currentUser);
  }

  /**
   * Legacy / Alternate checkout endpoint supporting dealId in request body.
   */
  @Post('checkout')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Tạo link thanh toán checkout (Body Payload format)',
  })
  @ApiResponse({ status: 201, description: 'Tạo payment link thành công.' })
  @ApiResponse({
    status: 400,
    description: 'Thiếu dealId hoặc trạng thái không hợp lệ.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Người bán không thể tự mua hoặc thanh toán sản phẩm của chính mình.',
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

  /**
   * Sandbox only: Simulates successful VietQR deposit for development/testing.
   */
  @Post('simulate-success/:dealId')
  @ApiOperation({
    summary: 'Mô phỏng thanh toán VietQR thành công (Sandbox Dev mode)',
  })
  @ApiParam({
    name: 'dealId',
    type: String,
    description: 'UUID của Deal cần mô phỏng đặt cọc',
  })
  async simulateSuccess(@Param('dealId', new ParseUUIDPipe()) dealId: string) {
    return this.paymentsService.simulatePaymentSuccess(dealId);
  }
}
