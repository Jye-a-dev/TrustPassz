import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role, Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  RequestUser,
} from '../../common/decorators/current-user.decorator';
import { RelayerFundingService } from './relayer-funding.service';
import {
  ConfirmFundingDto,
  ConfirmFundingResponseDto,
  RelayerBalanceResponseDto,
} from './dto/relayer-funding.dto';

@ApiTags('Relayer Funding')
@ApiBearerAuth()
@Controller('api/v1/admin/relayer')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, 'ADMIN', 'SUPER_ADMIN')
export class RelayerFundingController {
  constructor(
    private readonly relayerFundingService: RelayerFundingService,
  ) {}

  @Get('balance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lấy địa chỉ & số dư thời gian thực của ví Solana Relayer tổng',
    description:
      'Truy vấn trực tiếp RPC Solana để lấy số dư Lamports và SOL hiện tại của ví Relayer thực hiện các tác vụ ký quỹ tự động.',
  })
  @ApiOkResponse({
    description: 'Số dư ví Solana Relayer và trạng thái cảnh báo',
    type: RelayerBalanceResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Phiên đăng nhập hết hạn hoặc chưa cung cấp JWT Token',
  })
  @ApiForbiddenResponse({
    description: 'Yêu cầu quyền hạn SUPER_ADMIN hoặc ADMIN',
  })
  async getRelayerBalance(): Promise<RelayerBalanceResponseDto> {
    return this.relayerFundingService.getRelayerBalance();
  }

  @Post('fund/confirm')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Tiếp nhận & xác thực transaction nạp SOL vào ví Relayer',
    description:
      'Verify chữ ký giao dịch on-chain từ RPC Solana, đảm bảo người nhận đúng là SOLANA_RELAYER_PUBLIC_KEY, kiểm tra số tiền on-chain khớp payload, kiểm tra mã 2FA và ghi nhận vào RelayerFundingLog chống replay attack.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Xác thực nạp SOL thành công và đã ghi log nguyên tử',
    type: ConfirmFundingResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Giao dịch on-chain thất bại, không tìm thấy lệnh chuyển SOL, hoặc số tiền nạp không đủ',
  })
  @ApiUnauthorizedResponse({
    description:
      'Chưa đăng nhập hoặc mã xác thực 2 bước (2FA OTP/PIN) không chính xác',
  })
  @ApiForbiddenResponse({
    description: 'Tài khoản không có quyền cấp vốn (Chỉ SUPER_ADMIN hoặc ADMIN)',
  })
  @ApiConflictResponse({
    description:
      'Chữ ký TxHash đã từng được ghi nhận trong hệ thống (Replay Attack Prevention)',
  })
  async confirmFunding(
    @Body() dto: ConfirmFundingDto,
    @CurrentUser() adminUser: RequestUser,
  ): Promise<ConfirmFundingResponseDto> {
    return this.relayerFundingService.verifyAndRecordFunding(dto, adminUser);
  }
}

