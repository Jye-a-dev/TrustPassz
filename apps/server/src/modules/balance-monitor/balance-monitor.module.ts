/**
 * balance-monitor.module.ts
 *
 * NestJS module registering BalanceMonitorService for multi-chain relayer gas monitoring.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BalanceMonitorService } from './balance-monitor.service';

@Module({
  imports: [ConfigModule],
  providers: [BalanceMonitorService],
  exports: [BalanceMonitorService],
})
export class BalanceMonitorModule {}

