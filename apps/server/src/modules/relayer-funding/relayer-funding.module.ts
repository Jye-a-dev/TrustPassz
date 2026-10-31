import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { RelayerFundingController } from './relayer-funding.controller';
import { RelayerFundingService } from './relayer-funding.service';

@Module({
  imports: [DatabaseModule, ConfigModule, AuthModule],
  controllers: [RelayerFundingController],
  providers: [RelayerFundingService],
  exports: [RelayerFundingService],
})
export class RelayerFundingModule {}

