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
import { DisputesService } from './disputes.service';
import {
  OpenDisputeDto,
  QueryDisputeDto,
  ResolveDisputeDto,
} from './dto/dispute.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role, Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  RequestUser,
} from '../../common/decorators/current-user.decorator';

@ApiTags('Disputes & AI Arbitration')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/disputes')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  @ApiOperation({
    summary: 'Open dispute on deal and initiate AI Arbitration',
    description:
      'Locks escrow deal in DISPUTED state, stores evidence URLs, and triggers initial AI analysis.',
  })
  @ApiResponse({
    status: 201,
    description: 'Dispute opened and AI evaluation recorded.',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot dispute settled or refunded deal.',
  })
  @ApiResponse({
    status: 403,
    description: 'User is not a participant (buyer/seller) of the deal.',
  })
  async openDispute(
    @Body() dto: OpenDisputeDto,
    @CurrentUser() currentUser: RequestUser,
  ) {
    return this.disputesService.openDispute(dto, currentUser);
  }

  @Get()
  @Roles(Role.ADMIN, Role.ARBITRATOR, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'List disputes with status filter and pagination',
    description:
      'Retrieves disputes with filters for deal ID and dispute status (Admin/Arbitrator only).',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of disputes.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient privileges.' })
  async findAll(@Query() query: QueryDisputeDto) {
    return this.disputesService.findAll(query);
  }

  @Get('deal/:dealId')
  @ApiOperation({
    summary: 'Get dispute details by deal UUID',
    description:
      'Returns latest dispute audit log, AI confidence score, and arbitration status for a given deal.',
  })
  @ApiParam({ name: 'dealId', description: 'Deal UUID v4' })
  @ApiResponse({ status: 200, description: 'Dispute details or null.' })
  @ApiResponse({ status: 403, description: 'Forbidden: User is not authorized to view this dispute.' })
  async findByDeal(
    @Param('dealId', new ParseUUIDPipe()) dealId: string,
    @CurrentUser() currentUser: RequestUser,
  ) {
    return this.disputesService.findByDealId(dealId, currentUser);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get dispute details, AI reasoning, and evidence by UUID',
    description:
      'Returns full audit log with AI confidence score and arbitrator decisions.',
  })
  @ApiParam({ name: 'id', description: 'Dispute UUID v4' })
  @ApiResponse({ status: 200, description: 'Dispute details.' })
  @ApiResponse({ status: 403, description: 'Forbidden: User is not authorized to view this dispute.' })
  @ApiResponse({ status: 404, description: 'Dispute not found.' })
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() currentUser: RequestUser,
  ) {
    return this.disputesService.findOne(id, currentUser);
  }

  @Post(':id/escalate')
  @ApiOperation({
    summary: 'Escalate dispute to human Admin Arbitrator',
    description: 'Moves dispute status from AI_PROCESSING to ADMIN_ESCALATED.',
  })
  @ApiParam({ name: 'id', description: 'Dispute UUID v4' })
  @ApiResponse({ status: 200, description: 'Dispute escalated to admin.' })
  @ApiResponse({ status: 403, description: 'Forbidden: User is not authorized to escalate this dispute.' })
  async escalate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() currentUser: RequestUser,
  ) {
    return this.disputesService.escalate(id, currentUser);
  }

  @Patch(':id/resolve')
  @Roles(Role.ADMIN, Role.ARBITRATOR, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Submit binding arbitration resolution',
    description:
      'Arbitrator issues verdict (APPROVE_PAYOUT or TRIGGER_REFUND), closing the dispute and transitioning deal state.',
  })
  @ApiParam({ name: 'id', description: 'Dispute UUID v4' })
  @ApiResponse({
    status: 200,
    description: 'Dispute closed and deal state transitioned.',
  })
  @ApiResponse({ status: 400, description: 'Dispute already closed.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Insufficient privileges or invalid 2FA PIN.' })
  async resolve(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ResolveDisputeDto,
    @CurrentUser() currentUser: RequestUser,
  ) {
    return this.disputesService.resolve(id, dto, currentUser);
  }
}
