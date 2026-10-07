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

  /**
   * Aggregates total deals and state breakdown.
   * Public route: placed prior to `:id` endpoint to prevent route collision.
   */
  @Public()
  @Get('count')
  @ApiOperation({
    summary: 'Count deals with state breakdown',
    description:
      'Kiểm tra tổng số lượng deal và breakdown chi tiết theo từng trạng thái. Hỗ trợ filter theo sellerId hoặc buyerId.',
  })
  @ApiQuery({
    name: 'sellerId',
    required: false,
    type: String,
    description: 'Filter deals created by specific seller UUID',
    example: '11111111-1111-4111-a111-111111111111',
  })
  @ApiQuery({
    name: 'buyerId',
    required: false,
    type: String,
    description: 'Filter deals designated for specific buyer UUID',
    example: '22222222-2222-4222-a222-222222222222',
  })
  @ApiResponse({
    status: 200,
    description: 'Tổng số deal và phân loại theo trạng thái thành công.',
    schema: {
      example: {
        total: 12,
        breakdown: {
          PENDING: 4,
          DEPOSITED: 3,
          IN_INSPECTION: 2,
          SETTLED: 2,
          REFUNDED: 1,
          DISPUTED: 0,
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Lỗi truy vấn cơ sở dữ liệu khi tổng hợp thống kê.',
  })
  async count(
    @Query('sellerId') sellerId?: string,
    @Query('buyerId') buyerId?: string,
  ) {
    return this.dealsService.countDeals(sellerId, buyerId);
  }

  /**
   * Creates a new deal and associates an encrypted digital vault asset.
   * Protected route: Requires authenticated participant role.
   */
  @Post()
  @Throttle({
    dealsWrite: {
      limit: THROTTLE_CONFIG.dealsWriteLimit,
      ttl: THROTTLE_CONFIG.ttlMs,
    },
  })
  @Roles(Role.USER, Role.SELLER, Role.BUYER, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new deal with encrypted Digital Vault asset',
    description:
      'Tạo mới deal và đóng gói tài sản số mã hóa vào Digital Vault. Thực thi trong prisma.$transaction ACID.',
  })
  @ApiResponse({
    status: 201,
    description: 'Tạo deal và lưu trữ Digital Vault thành công.',
    schema: {
      example: {
        id: 'd0000000-0000-4000-a000-000000000001',
        title: 'Fullstack Escrow Marketplace Source Code',
        amount: '500000',
        currency: 'VND',
        state: 'PENDING',
        inspectionDuration: 43200,
        digitalAsset: {
          id: 'da000000-0000-4000-a000-000000000001',
          assetType: 'SOURCE_CODE',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu đầu vào không hợp lệ (class-validator rejected).',
  })
  @ApiResponse({
    status: 404,
    description: 'Người bán (sellerId) hoặc người mua (buyerId) không tồn tại.',
  })
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

  /**
   * Retrieves paginated deals with filter and search capabilities.
   * Public route: Bargain Room / marketplace discovery.
   */
  @Public()
  @Get()
  @ApiOperation({
    summary: 'List deals with pagination, filter and search',
    description: 'Lấy danh sách deal kèm phân trang meta và bộ lọc đa năng.',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách deal kèm thông tin meta phân trang.',
    schema: {
      example: {
        data: [
          {
            id: 'd0000000-0000-4000-a000-000000000001',
            title: 'Fullstack Escrow Marketplace Source Code',
            amount: '500000',
            currency: 'VND',
            state: 'PENDING',
            seller: {
              id: '11111111-1111-4111-a111-111111111111',
              walletAddress: '0x1111111111111111111111111111111111111111',
              displayName: 'Trusted Seller',
              avatarUrl: 'https://trustpassz.io/avatars/seller.png',
            },
            digitalAsset: {
              id: 'da000000-0000-4000-a000-000000000001',
              assetType: 'SOURCE_CODE',
              fileName: 'trustpassz-escrow-v1.zip',
              fileSizeBytes: '52428800',
            },
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
    },
  })
  async findAll(@Query() query: QueryDealDto) {
    return this.dealsService.findAll(query);
  }

  /**
   * Retrieves deal details by ID.
   * Public route: Enables viewing deal information and public bargain rooms.
   */
  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Get deal details by ID with Digital Vault metadata',
    description:
      'Lấy chi tiết deal theo ID UUID (trả về cả metadata Digital Vault, đối tác buyer/seller, disputeLogs).',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID của deal cần tra cứu',
    example: 'd0000000-0000-4000-a000-000000000001',
  })
  @ApiResponse({
    status: 200,
    description: 'Thông tin chi tiết deal tìm thấy.',
  })
  @ApiResponse({
    status: 400,
    description: 'Tham số ID không phải định dạng UUID hợp lệ.',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy deal với ID cung cấp.',
  })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.dealsService.findOne(id);
  }

  /**
   * Updates deal fields partially. Rejects modifications on terminal states.
   * Protected route: Requires authenticated participant role.
   */
  @Patch(':id')
  @Throttle({
    dealsWrite: {
      limit: THROTTLE_CONFIG.dealsWriteLimit,
      ttl: THROTTLE_CONFIG.ttlMs,
    },
  })
  @Roles(Role.USER, Role.SELLER, Role.BUYER, Role.ADMIN)
  @ApiOperation({
    summary: 'Partial update deal & upsert Digital Vault asset',
    description:
      'Thử nghiệm cập nhật từng phần (Partial Update). Sẽ trả về lỗi HTTP 400 nếu deal đã ở Terminal States (SETTLED, REFUNDED).',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID của deal cần cập nhật',
    example: 'd0000000-0000-4000-a000-000000000001',
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thành công các trường được cung cấp.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Không thể cập nhật deal: Deal đang ở trạng thái Terminal (SETTLED, REFUNDED).',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy deal với ID chỉ định.',
  })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateDealDto: UpdateDealDto,
    @CurrentUser('userId') _userId: string,
  ) {
    return this.dealsService.update(id, updateDealDto);
  }

  /**
   * Removes deal. Permitted only if deal is in PENDING state.
   * Protected route: Requires authenticated participant role.
   */
  @Delete(':id')
  @Throttle({
    dealsWrite: {
      limit: THROTTLE_CONFIG.dealsWriteLimit,
      ttl: THROTTLE_CONFIG.ttlMs,
    },
  })
  @Roles(Role.USER, Role.SELLER, Role.BUYER, Role.ADMIN)
  @ApiOperation({
    summary: 'Delete a deal in PENDING state',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID của deal cần xóa',
  })
  @ApiResponse({
    status: 200,
    description: 'Xóa deal thành công.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Chặn thao tác xóa: chỉ deal ở trạng thái PENDING mới được phép xóa.',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy deal với ID cung cấp.',
  })
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser('userId') _userId: string,
  ) {
    return this.dealsService.remove(id);
  }

  /**
   * Unlocks digital vault asset, tracking access attempts and checking quota.
   * Protected route: Requires authenticated participant role.
   */
  @Post(':id/vault/unlock')
  @Throttle({
    dealsWrite: {
      limit: THROTTLE_CONFIG.dealsWriteLimit,
      ttl: THROTTLE_CONFIG.ttlMs,
    },
  })
  @Roles(Role.USER, Role.SELLER, Role.BUYER, Role.ADMIN)
  @ApiOperation({
    summary: 'Unlock and retrieve encrypted Digital Vault asset payload',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID của deal chứa digital vault asset',
  })
  @ApiResponse({
    status: 200,
    description: 'Digital vault asset unlocked successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Deal not deposited or maximum access limit reached.',
  })
  @ApiResponse({
    status: 404,
    description: 'Deal or digital asset not found.',
  })
  async unlockVault(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser('id') _userId: string,
  ) {
    return this.dealsService.unlockVault(id);
  }

  /**
   * Settles deal escrow, releasing funds to seller.
   * Protected route: Requires authenticated participant role.
   */
  @Post(':id/settle')
  @Throttle({
    dealsWrite: {
      limit: THROTTLE_CONFIG.dealsWriteLimit,
      ttl: THROTTLE_CONFIG.ttlMs,
    },
  })
  @Roles(Role.USER, Role.SELLER, Role.BUYER, Role.ADMIN)
  @ApiOperation({
    summary: 'Settle deal escrow and release payment to seller',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID của deal cần xác nhận nghiệm thu và giải ngân',
  })
  @ApiResponse({
    status: 200,
    description: 'Escrow settled successfully and funds released.',
  })
  async settle(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser('id') _userId: string,
  ) {
    return this.dealsService.triggerSettle(id);
  }
}
