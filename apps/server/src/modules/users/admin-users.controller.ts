import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { CurrentUser, RequestUser } from '../../common/decorators/current-user.decorator';
import { AdminUsersService } from './admin-users.service';
import {
  QueryAdminUsersDto,
  ToggleFreezeUserDto,
  UpdateUserRoleDto,
} from './dto/admin-user.dto';

@ApiTags('Admin User Management & RBAC')
@ApiBearerAuth('JWT-auth')
@Controller('api/v1/admin/users')
@UseGuards(AuthGuard, RolesGuard)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.ARBITRATOR)
  @ApiOperation({
    summary: 'Search and list users with wallet details and dispute rates',
    description:
      'Provides debounced search by UUID, Email, Solana Base58, or Base Sepolia 0x address.',
  })
  @ApiResponse({ status: 200, description: 'Paginated user list.' })
  async findAll(@Query() query: QueryAdminUsersDto) {
    return this.adminUsersService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.ARBITRATOR)
  @ApiOperation({
    summary: 'Get user detailed profile with real-time on-chain balance',
    description: 'Returns KYC status, dispute history, and on-chain assets.',
  })
  @ApiParam({ name: 'id', description: 'User UUID v4' })
  @ApiResponse({ status: 200, description: 'Detailed user profile.' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.adminUsersService.findOne(id);
  }

  @Patch(':id/role')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Update user RBAC permission role',
    description:
      'Assigns USER, ARBITRATOR, or ADMIN role with mandatory audit justification.',
  })
  @ApiParam({ name: 'id', description: 'User UUID v4' })
  @ApiResponse({ status: 200, description: 'User role successfully updated.' })
  async updateRole(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() adminUser: RequestUser,
  ) {
    return this.adminUsersService.updateRole(id, dto, adminUser?.id);
  }

  @Patch(':id/freeze')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Freeze or unfreeze suspicious user wallet',
    description:
      'Locks escrow deal participation and digital vault downloads for fraudulent actors.',
  })
  @ApiParam({ name: 'id', description: 'User UUID v4' })
  @ApiResponse({ status: 200, description: 'Wallet freeze status toggled.' })
  async toggleFreeze(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ToggleFreezeUserDto,
    @CurrentUser() adminUser: RequestUser,
  ) {
    return this.adminUsersService.toggleFreeze(id, dto, adminUser?.id);
  }
}

