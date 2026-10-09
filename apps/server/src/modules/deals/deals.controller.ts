import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { QueryDealDto } from './dto/query-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';
import { Role, Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  RequestUser,
} from '../../common/decorators/current-user.decorator';
import { THROTTLE_CONFIG } from '../../config/throttle.config';

@ApiTags('Deals & Digital Vault')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@Controller('api/v1/deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Public()
  @Get('count')
  @ApiOperation({
    summary: 'Count deals with state breakdown',
    description: 'Kiểm tra tổng số lượng deal và breakdown theo từng trạng thái.',
  })
  @ApiQuery({ name: 'sellerId', required: false, type: String })
  @ApiQuery({ name: 'buyerId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Tổng số deal thành công.' })
  async count(
    @Query('sellerId') sellerId?: string,
    @Query('buyerId') buyerId?: string,
  ) {
    return this.dealsService.countDeals(sellerId, buyerId);
  }

  @Post()
  @Throttle({
    deals: { limit: THROTTLE_CONFIG.dealsLimit, ttl: THROTTLE_CONFIG.dealsTtlMs },
    dealsWrite: { limit: THROTTLE_CONFIG.dealsWriteLimit, ttl: THROTTLE_CONFIG.ttlMs },
  })
  @Roles(Role.USER, Role.SELLER, Role.BUYER, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new deal with encrypted Digital Vault asset',
    description: 'Tạo mới deal và đóng gói tài sản số mã hóa vào Digital Vault.',
  })
  @ApiResponse({ status: 201, description: 'Tạo deal thành công.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ.' })
  @ApiResponse({ status: 404, description: 'Người bán hoặc người mua không tồn tại.' })
  async create(
    @Body() createDealDto: CreateDealDto,
    @CurrentUser() user: RequestUser,
    @Headers('idempotency-key') headerKey?: string,
    @Headers('x-idempotency-key') altHeaderKey?: string,
  ) {
    const sellerId = createDealDto.sellerId || user.id;
    if (createDealDto.buyerId && createDealDto.buyerId === sellerId) {
      throw new ForbiddenException(
        'Bạn không thể tự mua sản phẩm của chính mình.',
      );
    }
    const idempotencyKey =
      headerKey || altHeaderKey || createDealDto.idempotencyKey;
    const payload: CreateDealDto = {
      ...createDealDto,
      sellerId,
      idempotencyKey,
    };
    return this.dealsService.create(payload, idempotencyKey);
  }

  @Public()
  @Get()
  @ApiOperation({
    summary: 'List deals with pagination, filter and search',
  })
  @ApiResponse({ status: 200, description: 'Danh sách deal.' })
  async findAll(@Query() query: QueryDealDto) {
    return this.dealsService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Get deal details by ID with Digital Vault metadata',
  })
  @ApiParam({ name: 'id', type: String, description: 'UUID của deal' })
  @ApiResponse({ status: 200, description: 'Thông tin chi tiết deal.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy deal.' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.dealsService.findOne(id);
  }

  @Patch(':id')
  @Throttle({
    deals: { limit: THROTTLE_CONFIG.dealsLimit, ttl: THROTTLE_CONFIG.dealsTtlMs },
    dealsWrite: { limit: THROTTLE_CONFIG.dealsWriteLimit, ttl: THROTTLE_CONFIG.ttlMs },
  })
  @Roles(Role.USER, Role.SELLER, Role.BUYER, Role.ADMIN)
  @ApiOperation({
    summary: 'Partial update deal & upsert Digital Vault asset',
  })
  @ApiParam({ name: 'id', type: String, description: 'UUID của deal' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công.' })
  @ApiResponse({ status: 400, description: 'Deal đang ở trạng thái Terminal.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy deal.' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateDealDto: UpdateDealDto,
    @CurrentUser('userId') _userId: string,
  ) {
    return this.dealsService.update(id, updateDealDto);
  }

  @Delete(':id')
  @Throttle({
    deals: { limit: THROTTLE_CONFIG.dealsLimit, ttl: THROTTLE_CONFIG.dealsTtlMs },
    dealsWrite: { limit: THROTTLE_CONFIG.dealsWriteLimit, ttl: THROTTLE_CONFIG.ttlMs },
  })
  @Roles(Role.USER, Role.SELLER, Role.BUYER, Role.ADMIN)
  @ApiOperation({
    summary: 'Delete a deal in PENDING state',
  })
  @ApiParam({ name: 'id', type: String, description: 'UUID của deal' })
  @ApiResponse({ status: 200, description: 'Xóa deal thành công.' })
  @ApiResponse({ status: 400, description: 'Chỉ deal PENDING mới được xóa.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy deal.' })
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser('userId') _userId: string,
  ) {
    return this.dealsService.remove(id);
  }

  @Post(':id/vault/unlock')
  @Throttle({
    deals: { limit: THROTTLE_CONFIG.dealsLimit, ttl: THROTTLE_CONFIG.dealsTtlMs },
    dealsWrite: { limit: THROTTLE_CONFIG.dealsWriteLimit, ttl: THROTTLE_CONFIG.ttlMs },
  })
  @Roles(Role.USER, Role.SELLER, Role.BUYER, Role.ADMIN)
  @ApiOperation({
    summary: 'Unlock and retrieve encrypted Digital Vault asset payload',
  })
  @ApiParam({ name: 'id', type: String, description: 'UUID của deal' })
  @ApiResponse({ status: 200, description: 'Mở khóa thành công.' })
  @ApiResponse({ status: 400, description: 'Quota vượt quá hoặc chưa cọc.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy deal.' })
  async unlockVault(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser('id') _userId: string,
  ) {
    return this.dealsService.unlockVault(id);
  }

  @Post(':id/settle')
  @Throttle({
    deals: { limit: THROTTLE_CONFIG.dealsLimit, ttl: THROTTLE_CONFIG.dealsTtlMs },
    dealsWrite: { limit: THROTTLE_CONFIG.dealsWriteLimit, ttl: THROTTLE_CONFIG.ttlMs },
  })
  @Roles(Role.USER, Role.SELLER, Role.BUYER, Role.ADMIN)
  @ApiOperation({
    summary: 'Settle deal escrow and release payment to seller',
  })
  @ApiParam({ name: 'id', type: String, description: 'UUID của deal' })
  @ApiResponse({ status: 200, description: 'Nghiệm thu thành công.' })
  async settle(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser('id') _userId: string,
  ) {
    return this.dealsService.triggerSettle(id);
  }
}
