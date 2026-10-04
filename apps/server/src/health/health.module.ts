import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { OracleRelayerModule } from '../oracle-relayer/oracle-relayer.module';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [DatabaseModule, OracleRelayerModule],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
