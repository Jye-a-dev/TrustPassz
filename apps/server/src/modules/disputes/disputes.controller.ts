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
import { DisputesService } from './disputes.service';
import {
  OpenDisputeDto,
  QueryDisputeDto,
  ResolveDisputeDto,
} from './dto/dispute.dto';

@ApiTags('Disputes & AI Arbitration')
@ApiBearerAuth('JWT-auth')
@Controller('api/v1/disputes')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  @ApiOperation({
    summary: 'Open dispute on deal and initiate AI Arbitration',
    description: 'Locks escrow deal in DISPUTED state, stores evidence URLs, and triggers initial AI analysis.',
  })
  @ApiResponse({ status: 201, description: 'Dispute opened and AI evaluation recorded.' })
  @ApiResponse({ status: 400, description: 'Cannot dispute settled or refunded deal.' })
  async openDispute(@Body() dto: OpenDisputeDto) {
    return this.disputesService.openDispute(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List disputes with status filter and pagination',
    description: 'Retrieves disputes with filters for deal ID and dispute status.',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of disputes.' })
  async findAll(@Query() query: QueryDisputeDto) {
    return this.disputesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get dispute details, AI reasoning, and evidence by UUID',
    description: 'Returns full audit log with AI confidence score and arbitrator decisions.',
  })
  @ApiParam({ name: 'id', description: 'Dispute UUID v4' })
  @ApiResponse({ status: 200, description: 'Dispute details.' })
  @ApiResponse({ status: 404, description: 'Dispute not found.' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.disputesService.findOne(id);
  }

  @Post(':id/escalate')
  @ApiOperation({
    summary: 'Escalate dispute to human Admin Arbitrator',
    description: 'Moves dispute status from AI_PROCESSING to ADMIN_ESCALATED.',
  })
  @ApiParam({ name: 'id', description: 'Dispute UUID v4' })
  @ApiResponse({ status: 200, description: 'Dispute escalated to admin.' })
  async escalate(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.disputesService.escalate(id);
  }

  @Patch(':id/resolve')
  @ApiOperation({
    summary: 'Submit binding arbitration resolution',
    description: 'Arbitrator issues verdict (APPROVE_PAYOUT or TRIGGER_REFUND), closing the dispute and transitioning deal state.',
  })
  @ApiParam({ name: 'id', description: 'Dispute UUID v4' })
  @ApiResponse({ status: 200, description: 'Dispute closed and deal state transitioned.' })
  @ApiResponse({ status: 400, description: 'Dispute already closed.' })
  async resolve(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.disputesService.resolve(id, dto);
  }
}
