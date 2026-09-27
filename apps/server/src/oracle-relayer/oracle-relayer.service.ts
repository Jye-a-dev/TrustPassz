/**
 * oracle-relayer.service.ts
 *
 * Atomic Oracle Relayer: signs and broadcasts on-chain transactions to the
 * DigitalEscrow contract on Base Sepolia via Viem.
 *
 * Nonce collision prevention: all writes are serialised through a per-instance
 * async queue (single-concurrency). Each operation acquires the lock, fetches
 * the live pending nonce from the node, submits the tx, awaits the receipt,
 * then releases the lock — guaranteeing strictly ordered nonce increments even
 * under concurrent service callers.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  createPublicClient,
  createWalletClient,
  http,
  type Hash,
  type TransactionReceipt,
  encodeFunctionData,
  decodeErrorResult,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { PrismaService } from '../database/prisma.service';
import { DealState } from '@prisma/client';
import { DIGITAL_ESCROW_ABI } from '../abi/DigitalEscrowABI';
import {
  loadOracleRelayerConfig,
  type OracleRelayerConfig,
} from './oracle-relayer.config';
import { AsyncMutex } from './async-mutex';
import type {
  DisputeAction,
  TxResult,
  ViemPublicClient,
  ViemWalletClient,
} from './oracle-relayer.types';

export type { DisputeAction, TxResult };

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class OracleRelayerService implements OnModuleInit {
  private readonly logger = new Logger(OracleRelayerService.name);

  private config!: OracleRelayerConfig;
  private walletClient!: ViemWalletClient;
  private publicClient!: ViemPublicClient;

  /** Serialises all write transactions from this relayer account */
  private readonly mutex = new AsyncMutex();

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit(): void {
    this.config = loadOracleRelayerConfig();

    const account = privateKeyToAccount(this.config.privateKey);

    this.walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(this.config.rpcUrl),
    });

    this.publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(this.config.rpcUrl),
    });

    this.logger.log(
      `Oracle Relayer initialised — account: ${account.address} — contract: ${this.config.contractAddress}`,
    );
  }

  // -------------------------------------------------------------------------
  // Public entrypoints
  // -------------------------------------------------------------------------

  /**
   * Calls `startInspection(bytes32 dealId)` on-chain.
   * Triggered when seller completes data handoff OR buyer opens vault for first time.
   * Updates Deal.state → IN_INSPECTION in DB after receipt.
   */
  async startInspection(dealId: string): Promise<TxResult | null> {
    const bytes32Id = this._toDealIdBytes32(dealId);
    this.logger.log(`[startInspection] dealId=${dealId}`);

    return this._sendTx(
      'startInspection',
      [bytes32Id],
      async (txHash, receipt) => {
        await this.prisma.deal.update({
          where: { id: dealId },
          data: {
            state: DealState.IN_INSPECTION,
            settleTxHash: txHash,
          },
        });
        this.logger.log(
          `[startInspection] DB updated → IN_INSPECTION | txHash=${txHash} | block=${receipt.blockNumber}`,
        );
      },
    );
  }

  /**
   * Calls `settle(bytes32 dealId)` on-chain.
   * Triggered when inspection deadline passes without dispute, or buyer confirms acceptance.
   * Updates Deal.state → SETTLED + settleTxHash in DB after receipt.
   */
  async settle(dealId: string): Promise<TxResult | null> {
    const bytes32Id = this._toDealIdBytes32(dealId);
    this.logger.log(`[settle] dealId=${dealId}`);

    return this._sendTx('settle', [bytes32Id], async (txHash, receipt) => {
      await this.prisma.deal.update({
        where: { id: dealId },
        data: {
          state: DealState.SETTLED,
          settleTxHash: txHash,
        },
      });
      this.logger.log(
        `[settle] DB updated → SETTLED | txHash=${txHash} | block=${receipt.blockNumber}`,
      );
    });
  }

  /**
   * Calls `resolveDispute(bytes32 dealId, bool refundBuyer)` on-chain based
   * on the AI/admin arbitration verdict from TASK-07.
   *
   * - APPROVE_PAYOUT  → resolveDispute(dealId, false) → SETTLED
   * - TRIGGER_REFUND  → resolveDispute(dealId, true)  → REFUNDED
   * - ESCALATE_TO_ADMIN → no on-chain tx; DB updated to ADMIN_ESCALATED path
   *   (DisputeStatus handled in disputes.service.ts, TASK-11)
   */
  async resolveDispute(
    dealId: string,
    action: DisputeAction,
  ): Promise<TxResult | null> {
    if (action === 'ESCALATE_TO_ADMIN') {
      this.logger.warn(
        `[resolveDispute] ESCALATE_TO_ADMIN for dealId=${dealId} — skipping on-chain tx, awaiting admin (TASK-11)`,
      );
      return null;
    }

    const refundBuyer = action === 'TRIGGER_REFUND';
    const bytes32Id = this._toDealIdBytes32(dealId);
    this.logger.log(
      `[resolveDispute] dealId=${dealId} action=${action} refundBuyer=${refundBuyer}`,
    );

    return this._sendTx(
      'resolveDispute',
      [bytes32Id, refundBuyer],
      async (txHash, receipt) => {
        const newState = refundBuyer ? DealState.REFUNDED : DealState.SETTLED;
        await this.prisma.deal.update({
          where: { id: dealId },
          data: {
            state: newState,
            disputeTxHash: txHash,
          },
        });
        this.logger.log(
          `[resolveDispute] DB updated → ${newState} | txHash=${txHash} | block=${receipt.blockNumber}`,
        );
      },
    );
  }

  // -------------------------------------------------------------------------
  // Core transaction engine (mutex-serialised, nonce-safe)
  // -------------------------------------------------------------------------

  /**
   * Generic signed transaction sender.
   *
   * Lifecycle (always within mutex):
   *   1. Fetch pending nonce from node (atomic read after lock)
   *   2. Simulate call to surface revert reason before spending gas
   *   3. writeContract → broadcast
   *   4. waitForTransactionReceipt
   *   5. Invoke onSuccess callback (DB writes)
   *   6. Release mutex
   *
   * On revert: logs detailed error, releases lock, returns null (does NOT throw)
   * so callers are not crashed.
   */
  private async _sendTx<TArgs extends readonly unknown[]>(
    functionName: string,
    args: TArgs,
    onSuccess: (txHash: Hash, receipt: TransactionReceipt) => Promise<void>,
  ): Promise<TxResult | null> {
    const release = await this.mutex.acquire();

    try {
      const account = privateKeyToAccount(this.config.privateKey);

      // 1. Simulate first — surfaces revert reason without burning gas
      try {
        await this.publicClient.simulateContract({
          address: this.config.contractAddress,
          abi: DIGITAL_ESCROW_ABI,
          functionName: functionName as never,
          args: args as never,
          account: account.address,
        });
      } catch (simError: unknown) {
        const reason = this._decodeRevertReason(simError);
        this.logger.error(
          `[${functionName}] Simulation reverted — reason: ${reason}`,
        );
        return null;
      }

      // 2. Fetch pending nonce (after simulation, under lock)
      const nonce = await this.publicClient.getTransactionCount({
        address: account.address,
        blockTag: 'pending',
      });

      // 3. Broadcast
      const txHash = await this.walletClient.writeContract({
        address: this.config.contractAddress,
        abi: DIGITAL_ESCROW_ABI,
        functionName: functionName as never,
        args: args as never,
        nonce,
        chain: baseSepolia,
        account,
      });

      this.logger.log(`[${functionName}] Broadcast txHash=${txHash}`);

      // 4. Wait for receipt
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: txHash,
        confirmations: 1,
        timeout: 120_000, // 2-min timeout for Base Sepolia
      });

      if (receipt.status === 'reverted') {
        this.logger.error(
          `[${functionName}] On-chain REVERT | txHash=${txHash} | block=${receipt.blockNumber}`,
        );
        return null;
      }

      // 5. DB persistence
      await onSuccess(txHash, receipt);

      return { txHash, receipt };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`[${functionName}] Unexpected error: ${msg}`, stack);
      return null;
    } finally {
      // 6. Always release lock — even on error
      release();
    }
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  /**
   * Converts a UUID deal ID to a bytes32 hex string required by the contract.
   * UUID (16 bytes) is zero-padded on the right to 32 bytes.
   */
  private _toDealIdBytes32(dealId: string): `0x${string}` {
    // Strip hyphens from UUID → 32 hex chars (16 bytes) → pad to 64 hex chars (32 bytes)
    const hex = dealId.replace(/-/g, '');
    if (hex.length !== 32) {
      throw new Error(
        `[OracleRelayer] Invalid dealId format — expected UUID (32 hex chars after strip), got length ${hex.length}`,
      );
    }
    return `0x${hex.padEnd(64, '0')}`;
  }

  /**
   * Attempts to ABI-decode a contract revert reason from a thrown error.
   * Falls back to raw message if decoding fails.
   */
  private _decodeRevertReason(error: unknown): string {
    try {
      if (
        error &&
        typeof error === 'object' &&
        'data' in error &&
        typeof (error as { data: unknown }).data === 'string'
      ) {
        const data = (error as { data: string }).data as `0x${string}`;
        const decoded = decodeErrorResult({ abi: DIGITAL_ESCROW_ABI, data });
        return `${decoded.errorName}(${JSON.stringify(decoded.args)})`;
      }
    } catch {
      // Fallback below
    }
    return error instanceof Error ? error.message : String(error);
  }

  // -------------------------------------------------------------------------
  // Read helpers (no mutex required)
  // -------------------------------------------------------------------------

  /** Returns the current pending nonce of the relayer account (diagnostic) */
  async getPendingNonce(): Promise<number> {
    const account = privateKeyToAccount(this.config.privateKey);
    return this.publicClient.getTransactionCount({
      address: account.address,
      blockTag: 'pending',
    });
  }

  /** Returns the relayer account address */
  getRelayerAddress(): string {
    return privateKeyToAccount(this.config.privateKey).address;
  }

  /** Encodes calldata for a given function (useful for gas estimation / testing) */
  encodeCalldata(
    functionName: 'startInspection' | 'settle' | 'resolveDispute',
    args: readonly unknown[],
  ): `0x${string}` {
    return encodeFunctionData({
      abi: DIGITAL_ESCROW_ABI,
      functionName: functionName as never,
      args: args as never,
    });
  }
}
