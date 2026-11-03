import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role, Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { FiatOnrampService } from './fiat-onramp.service';
import {
  CreateFiatOrderDto,
  FiatWebhookDto,
  QueryFiatOrderDto,
} from './dto/fiat-onramp.dto';

@ApiTags('Fiat-to-Crypto Top-up Engine (VietQR/USD to SOL)')
@Controller()
export class FiatOnrampController {
  constructor(private readonly fiatOnrampService: FiatOnrampService) {}

  @Post('api/v1/admin/fiat-onramp/order')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Create VietQR or USD fiat-to-SOL funding invoice',
    description:
      'Generates dynamic VietQR code for bank transfer. When paid, auto-dispatches SOL from Master Treasury.',
  })
  @ApiResponse({ status: 201, description: 'Order created with dynamic QR.' })
  async createOrder(
    @Body() dto: CreateFiatOrderDto,
    @CurrentUser() adminUser: RequestUser,
  ) {
    return this.fiatOnrampService.createOrder(dto, adminUser?.id);
  }

  @Get('api/v1/admin/fiat-onramp/orders')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'List fiat-to-crypto conversion funding orders',
    description: 'Returns historical fiat orders with payment status and Solana TxHash.',
  })
  @ApiResponse({ status: 200, description: 'Paginated fiat funding orders.' })
  async findAll(@Query() query: QueryFiatOrderDto) {
    return this.fiatOnrampService.findAll(query);
  }

  @Public()
  @Post('api/v1/fiat-onramp/webhook')
  @ApiOperation({
    summary: 'Payment Gateway (PayOS / Bank) webhook listener',
    description:
      'Receives IPN webhook, verifies payment status, and triggers instant on-chain SOL transfer.',
  })
  @ApiResponse({ status: 200, description: 'Webhook acknowledged and processed.' })
  async handleWebhook(@Body() payload: FiatWebhookDto) {
    return this.fiatOnrampService.processPaymentFulfillment(
      payload.orderCode,
      payload.paymentRefId,
    );
  }

  @Post('api/v1/admin/fiat-onramp/mock-pay/:orderCode')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Trigger simulated fiat payment fulfillment (Dev/Sandbox)',
    description: 'Manually marks order as paid and executes Solana transfer.',
  })
  @ApiParam({ name: 'orderCode', description: 'Numeric order code' })
  @ApiResponse({ status: 200, description: 'Order fulfilled and SOL transferred.' })
  async mockPay(@Param('orderCode') orderCode: string) {
    return this.fiatOnrampService.processPaymentFulfillment(
      orderCode,
      'ADMIN_MANUAL_MOCK_PAY',
    );
  }
}

