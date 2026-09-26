import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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
    description: 'Proposes an offer price with expiration deadline and negotiation message.',
  })
  @ApiResponse({ status: 201, description: 'Bargain offer submitted.' })
  @ApiResponse({ status: 400, description: 'Product not active or bargaining disabled.' })
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
    description: 'Retrieves current offer status, expiration timestamp, and negotiation log.',
  })
  @ApiParam({ name: 'id', description: 'Bargain offer UUID v4' })
  @ApiResponse({ status: 200, description: 'Bargain details.' })
  @ApiResponse({ status: 404, description: 'Bargain offer not found.' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.bargainsService.findOne(id);
  }

  @Patch(':id/respond')
  @ApiOperation({
    summary: 'Respond to bargain offer (Accept or Reject)',
    description: 'Seller accepts or rejects offer. If ACCEPTED, an Escrow Deal is automatically initialized.',
  })
  @ApiParam({ name: 'id', description: 'Bargain offer UUID v4' })
  @ApiResponse({ status: 200, description: 'Response recorded. If accepted, includes initialized deal.' })
  @ApiResponse({ status: 400, description: 'Offer expired or already resolved.' })
  async respond(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RespondBargainDto,
  ) {
    return this.bargainsService.respond(id, dto);
  }
}
