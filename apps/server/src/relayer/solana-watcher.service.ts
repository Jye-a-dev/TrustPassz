/**
 * solana-watcher.service.ts
 * Real-time event listener for TrustPassz Solana Escrow Program.
 * Subscribes to program logs, parses create_and_deposit events,
 * and updates Neon PostgreSQL with anti-replay guarantees.
 */

import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import {
  Connection,
  PublicKey,
  Logs,
  ParsedTransactionWithMeta,
} from '@solana/web3.js';
import bs58 from 'bs58';
import { PrismaService } from '../database/prisma.service';
import { DealState } from '@prisma/client';
import { AsyncMutex } from '../oracle-relayer/async-mutex';
import {
  SolanaDepositParsedEvent,
  ANCHOR_DISCRIMINATORS,
  DealWithDualChain,
} from './relayer.types';

@Injectable()
export class SolanaWatcherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SolanaWatcherService.name);
  private connection: Connection | null = null;
  private subscriptionId: number | null = null;
  private programId!: PublicKey;

  /** Anti-replay cache of processed transaction signatures */
  private readonly processedSignatures = new Set<string>();

  /** Per-deal mutex to prevent concurrent double-writes */
  private readonly dealMutexes = new Map<string, AsyncMutex>();

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit(): void {
    const rpcUrl =
      process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    const programIdStr =
      process.env.SOLANA_PROGRAM_ID ||
      'TrUsT11111111111111111111111111111111111111';

    try {
      this.programId = new PublicKey(programIdStr);
      this.connection = new Connection(rpcUrl, {
        commitment: 'confirmed',
        wsEndpoint: process.env.SOLANA_WS_URL,
      });

      if (process.env.SOLANA_WATCHER_ENABLED !== 'false') {
        this.startListening();
      } else {
        this.logger.log('SolanaWatcherService is disabled by configuration.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Solana Watcher initialization deferred: ${message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.connection && this.subscriptionId !== null) {
      await this.connection.removeOnLogsListener(this.subscriptionId);
      this.subscriptionId = null;
      this.logger.log('Unsubscribed from Solana program logs.');
    }
  }

  /**
   * Subscribes to Solana logs for the configured escrow program.
   */
  public startListening(): void {
    if (!this.connection) return;

    try {
      this.subscriptionId = this.connection.onLogs(
        this.programId,
        async (logs: Logs) => {
          await this.handleLogMessage(logs);
        },
        'confirmed',
      );
      this.logger.log(
        `Solana Watcher listening on program ${this.programId.toBase58()}`,
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to subscribe to Solana logs: ${msg}`);
    }
  }

  /**
   * Processes a detected transaction log event.
   */
  public async handleLogMessage(logs: Logs): Promise<void> {
    if (logs.err) return; // Ignore failed on-chain transactions

    const signature = logs.signature;
    if (this.processedSignatures.has(signature)) {
      this.logger.debug(`[ReplayGuard] Skipping signature: ${signature}`);
      return;
    }

    const hasDepositLog = logs.logs.some(
      (log) =>
        log.includes('Instruction: CreateAndDeposit') ||
        log.includes('Program log: Instruction: create_and_deposit') ||
        log.includes('DealDeposited'),
    );

    if (!hasDepositLog) return;

    this.processedSignatures.add(signature);
    this.logger.log(`[SolanaWatcher] Deposit detected in tx: ${signature}`);

    try {
      const tx = await this.connection?.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed',
      });

      if (!tx) {
        this.logger.warn(`Could not fetch transaction details for ${signature}`);
        return;
      }

      const parsedEvent = this.extractDepositDetails(tx, signature);
      if (parsedEvent) {
        await this.processDepositEvent(parsedEvent);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Error parsing Solana tx ${signature}: ${message}`,
      );
    }
  }

  /**
   * Extracts deal accounts and parameters from transaction metadata.
   */
  public extractDepositDetails(
    tx: ParsedTransactionWithMeta,
    signature: string,
  ): SolanaDepositParsedEvent | null {
    try {
      const message = tx.transaction.message;
      const accountKeys = message.accountKeys.map((a) =>
        typeof a === 'string' ? a : a.pubkey.toBase58(),
      );

      for (const ix of message.instructions) {
        const programKey = ix.programId.toBase58();
        if (programKey !== this.programId.toBase58()) continue;

        if ('data' in ix && typeof ix.data === 'string') {
          const rawBuffer = Buffer.from(bs58.decode(ix.data));
          const discriminator = rawBuffer.subarray(0, 8);

          if (discriminator.equals(ANCHOR_DISCRIMINATORS.create_and_deposit)) {
            const dealIdRaw = rawBuffer.subarray(8, 40);
            const amountLamports = rawBuffer.readBigUInt64LE(40);
            const dealIdHex = `0x${dealIdRaw.toString('hex')}`;
            const dealIdBase58 = bs58.encode(dealIdRaw);

            const accounts = 'accounts' in ix ? (ix.accounts as PublicKey[] | string[]) : [];
            const buyer = accounts[0]
              ? typeof accounts[0] === 'string'
                ? accounts[0]
                : accounts[0].toBase58()
              : accountKeys[0];
            const seller = accounts[1]
              ? typeof accounts[1] === 'string'
                ? accounts[1]
                : accounts[1].toBase58()
              : '';
            const pdaAddress = accounts[3]
              ? typeof accounts[3] === 'string'
                ? accounts[3]
                : accounts[3].toBase58()
              : '';

            return {
              dealIdHex,
              dealIdBase58,
              dealIdRaw: new Uint8Array(dealIdRaw),
              buyer,
              seller,
              amountLamports,
              depositedAt: Math.floor(Date.now() / 1000),
              signature,
              pdaAddress,
            };
          }
        }
      }
      return null;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`Failed extracting deposit details: ${msg}`);
      return null;
    }
  }

  /**
   * Persists the on-chain deposit event to the Deal model in Neon PostgreSQL.
   */
  public async processDepositEvent(
    event: SolanaDepositParsedEvent,
  ): Promise<boolean> {
    const lockKey = event.dealIdHex;
    let mutex = this.dealMutexes.get(lockKey);
    if (!mutex) {
      mutex = new AsyncMutex();
      this.dealMutexes.set(lockKey, mutex);
    }

    const release = await mutex.acquire();
    try {
      // Find matching deal by onchainDealId or wallet fallback
      const foundDeal = await this.prisma.deal.findFirst({
        where: {
          OR: [
            { onchainDealId: event.dealIdHex },
            { onchainDealId: event.dealIdBase58 },
          ],
        },
      });

      const deal = foundDeal as DealWithDualChain | null;

      if (!deal) {
        this.logger.warn(
          `[SolanaWatcher] No matching Deal found for onchainDealId=${event.dealIdHex} / PDA=${event.pdaAddress}`,
        );
        return false;
      }

      if (
        deal.state === DealState.DEPOSITED ||
        deal.state === DealState.IN_INSPECTION ||
        deal.state === DealState.SETTLED
      ) {
        this.logger.log(
          `[SolanaWatcher] Deal ${deal.id} already at state=${deal.state}; skipping update.`,
        );
        return true;
      }

      await this.prisma.deal.update({
        where: { id: deal.id },
        data: {
          state: DealState.DEPOSITED,
          depositedAt: new Date(event.depositedAt * 1000),
          onchainDealId: event.dealIdHex,
          ...({
            depositTxHash: event.signature,
            solanaPdaAddress: event.pdaAddress,
            buyerWallet: deal.buyerWallet || event.buyer,
            sellerWallet: deal.sellerWallet || event.seller,
          } as any),
        },
      });

      this.logger.log(
        `[SolanaWatcher] Deal ${deal.id} transition to DEPOSITED via tx: ${event.signature}`,
      );
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed updating Deal on deposit event: ${msg}`);
      return false;
    } finally {
      release();
    }
  }

  /**
   * Helper to manually record a transaction signature as processed.
   */
  public markSignatureProcessed(sig: string): void {
    this.processedSignatures.add(sig);
  }
}
