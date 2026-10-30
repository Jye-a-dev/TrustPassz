/**
 * relayer.module.ts
 * Module declaring Dual-Chain unified relayer and Solana watcher services.
 */

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { OracleRelayerModule } from '../oracle-relayer/oracle-relayer.module';
import { SolanaWatcherService } from './solana-watcher.service';
import { UnifiedRelayerService } from './unified-relayer.service';

@Module({
  imports: [DatabaseModule, OracleRelayerModule],
  providers: [SolanaWatcherService, UnifiedRelayerService],
  exports: [SolanaWatcherService, UnifiedRelayerService],
})
export class RelayerModule {}

