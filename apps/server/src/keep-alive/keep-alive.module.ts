import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { KeepAliveController } from './keep-alive.controller';
import { KeepAliveService } from './keep-alive.service';

@Module({
  imports: [DatabaseModule],
  controllers: [KeepAliveController],
  providers: [KeepAliveService],
  exports: [KeepAliveService],
})
export class KeepAliveModule {}

