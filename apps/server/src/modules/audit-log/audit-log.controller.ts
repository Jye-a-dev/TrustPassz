import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role, Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { AuditLogService } from './audit-log.service';
import { CreateAuditLogDto, QueryAuditLogDto } from './dto/audit-log.dto';

@ApiTags('Admin Audit & Intervention Logs')
@ApiBearerAuth('JWT-auth')
@Controller('api/v1/admin/audit-logs')
@UseGuards(AuthGuard, RolesGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.ARBITRATOR)
  @ApiOperation({
    summary: 'Query immutable admin audit log entries',
    description:
      'Returns paginated audit trail for on-chain overrides, wallet freezes, role updates, and funding operations.',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of audit logs.' })
  async findAll(@Query() query: QueryAuditLogDto) {
    return this.auditLogService.findAll(query);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.ARBITRATOR)
  @ApiOperation({
    summary: 'Record administrative action or on-chain intervention audit trail',
    description:
      'Persists high-security audit log capturing actor credentials, target state, rationale, and on-chain tx hash.',
  })
  @ApiResponse({ status: 201, description: 'Audit log successfully recorded.' })
  async create(
    @Body() dto: CreateAuditLogDto,
    @CurrentUser() adminUser: RequestUser,
    @Req() req: Request,
  ) {
    const forwarded = req.headers['x-forwarded-for'];
    const ipAddress =
      typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : req.socket?.remoteAddress || '127.0.0.1';

    const userAgent = req.headers['user-agent'] || 'TrustPassz-Admin-Portal/1.0';

    return this.auditLogService.record({
      ...dto,
      adminId: dto.adminId || adminUser?.id,
      ipAddress: dto.ipAddress || ipAddress,
      userAgent: dto.userAgent || userAgent,
    });
  }
}

