/**
 * oracle-relayer.module.ts
 *
 * Registers OracleRelayerService into NestJS IoC.
 * DatabaseModule is imported so PrismaService is available for injection.
 * OracleRelayerService is exported so DealsModule and DisputesModule can use it.
 */

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { OracleRelayerService } from './oracle-relayer.service';

@Module({
  imports: [DatabaseModule],
  providers: [OracleRelayerService],
  exports: [OracleRelayerService],
})
export class OracleRelayerModule {}
