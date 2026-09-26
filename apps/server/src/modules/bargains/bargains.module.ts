import { Module } from '@nestjs/common';
import { BargainsController } from './bargains.controller';
import { BargainsService } from './bargains.service';

@Module({
  controllers: [BargainsController],
  providers: [BargainsService],
  exports: [BargainsService],
})
export class BargainsModule {}
