import { Module } from '@nestjs/common';
import { FiatOnrampController } from './fiat-onramp.controller';
import { FiatOnrampService } from './fiat-onramp.service';
import { AuthModule } from '../auth/auth.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuthModule, AuditLogModule],
  controllers: [FiatOnrampController],
  providers: [FiatOnrampService],
  exports: [FiatOnrampService],
})
export class FiatOnrampModule {}

