import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { OracleRelayerModule } from '../../oracle-relayer/oracle-relayer.module';
import { DealsController } from './deals.controller';
import { DealsService } from './deals.service';

@Module({
  imports: [DatabaseModule, OracleRelayerModule],
  controllers: [DealsController],
  providers: [DealsService],
  exports: [DealsService],
})
export class DealsModule {}
