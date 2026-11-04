import {
  Body,
  Controller,
  Get,
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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import {
  CurrentUser,
  RequestUser,
} from '../../common/decorators/current-user.decorator';
import { BargainsService } from './bargains.service';
import {
  CreateBargainDto,
  QueryBargainDto,
  RespondBargainDto,
} from './dto/bargain.dto';

@ApiTags('Bargain & Dynamic Negotiation')
@ApiBearerAuth('JWT-auth')
@Controller('api/v1/bargains')
export class BargainsController {
  constructor(private readonly bargainsService: BargainsService) {}

  @Post()
  @ApiOperation({
    summary: 'Submit price bargain offer for product',
    description:
      'Proposes an offer price with expiration deadline and negotiation message.',
  })
  @ApiResponse({ status: 201, description: 'Bargain offer submitted.' })
  @ApiResponse({
    status: 400,
    description: 'Product not active or bargaining disabled.',
  })
  async create(@Body() dto: CreateBargainDto) {
    return this.bargainsService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List bargain offers with pagination',
    description: 'Filter bargain offers by product ID, buyer ID, and status.',
  })
  @ApiResponse({ status: 200, description: 'List of bargain offers.' })
  async findAll(@Query() query: QueryBargainDto) {
    return this.bargainsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get bargain offer details by UUID',
    description:
      'Retrieves current offer status, expiration timestamp, and negotiation log.',
  })
  @ApiParam({ name: 'id', description: 'Bargain offer UUID v4' })
  @ApiResponse({ status: 200, description: 'Bargain details.' })
  @ApiResponse({ status: 404, description: 'Bargain offer not found.' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.bargainsService.findOne(id);
  }

  @Post(':id/accept')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Accept bargain offer (Seller only)',
    description:
      'Người bán chấp thuận mức giá đề xuất, cập nhật giá deal, từ chối các đề xuất khác và broadcast sự kiện realtime.',
  })
  @ApiParam({ name: 'id', description: 'Bargain offer UUID v4' })
  @ApiResponse({ status: 200, description: 'Đã chấp nhận đề xuất trả giá.' })
  @ApiResponse({ status: 403, description: 'Chỉ người bán mới có quyền chấp thuận.' })
  async accept(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() currentUser: RequestUser,
  ) {
    return this.bargainsService.acceptOffer(id, currentUser);
  }

  @Post(':id/reject')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Reject bargain offer (Seller only)',
    description:
      'Người bán từ chối mức giá đề xuất và broadcast sự kiện realtime.',
  })
  @ApiParam({ name: 'id', description: 'Bargain offer UUID v4' })
  @ApiResponse({ status: 200, description: 'Đã từ chối đề xuất trả giá.' })
  @ApiResponse({ status: 403, description: 'Chỉ người bán mới có quyền từ chối.' })
  async reject(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() currentUser: RequestUser,
  ) {
    return this.bargainsService.rejectOffer(id, currentUser);
  }

  @Patch(':id/respond')
  @ApiOperation({
    summary: 'Respond to bargain offer (Accept or Reject)',
    description:
      'Seller accepts or rejects offer. If ACCEPTED, an Escrow Deal is automatically initialized.',
  })
  @ApiParam({ name: 'id', description: 'Bargain offer UUID v4' })
  @ApiResponse({
    status: 200,
    description: 'Response recorded. If accepted, includes initialized deal.',
  })
  @ApiResponse({
    status: 400,
    description: 'Offer expired or already resolved.',
  })
  async respond(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RespondBargainDto,
    @CurrentUser() currentUser?: RequestUser,
  ) {
    return this.bargainsService.respond(id, dto, currentUser);
  }
}
