import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { AuthModule } from '../auth/auth.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuthModule, AuditLogModule],
  controllers: [UsersController, AdminUsersController],
  providers: [UsersService, AdminUsersService],
  exports: [UsersService, AdminUsersService],
})
export class UsersModule {}
