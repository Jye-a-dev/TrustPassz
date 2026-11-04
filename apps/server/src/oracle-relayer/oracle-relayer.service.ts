/**
 * oracle-relayer.service.ts
 * Atomic Oracle Relayer: signs and broadcasts on-chain transactions to DigitalEscrow on Base Sepolia.
 * Nonce-safe, mutex-serialised write operations with on-chain state validation.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  createPublicClient,
  createWalletClient,
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
import { loadOracleRelayerConfig, type OracleRelayerConfig } from './oracle-relayer.config';
import { createViemFallbackTransport } from '../lib/viem-client';
import { AsyncMutex } from './async-mutex';
import type { DisputeAction, TxResult, ViemPublicClient, ViemWalletClient } from './oracle-relayer.types';

export type { DisputeAction, TxResult };

// On-chain EscrowTypes.DealState enumeration mapping
export const ONCHAIN_DEAL_STATE = {
  UNINITIALIZED: 0,
  PENDING: 1,
  DEPOSITED: 2,
  IN_INSPECTION: 3,
  SETTLED: 4,
  REFUNDED: 5,
  DISPUTED: 6,
} as const;

@Injectable()
export class OracleRelayerService implements OnModuleInit {
  private readonly logger = new Logger(OracleRelayerService.name);
  private config!: OracleRelayerConfig;
  private walletClient!: ViemWalletClient;
  private publicClient!: ViemPublicClient;
  private readonly mutex = new AsyncMutex();

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit(): void {
    this.config = loadOracleRelayerConfig();
    const account = privateKeyToAccount(this.config.privateKey);
    const fallbackTransport = createViemFallbackTransport({
      primaryRpcUrl: this.config.rpcUrl,
      alchemyApiKey: this.config.alchemyApiKey,
      infuraApiKey: this.config.infuraApiKey,
      alchemyRpcUrl: this.config.alchemyRpcUrl,
      infuraRpcUrl: this.config.infuraRpcUrl,
    });

    this.walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: fallbackTransport,
    });

    this.publicClient = createPublicClient({
      chain: baseSepolia,
      transport: fallbackTransport,
    });

    this.logger.log(`Oracle Relayer initialised — account: ${account.address} — contract: ${this.config.contractAddress}`);
  }

  async getChainStatus() {
    const startTime = Date.now();
    try {
      if (!this.publicClient) {
        return {
          status: 'down' as const,
          network: 'Base Sepolia',
          chainId: baseSepolia.id,
          contractAddress: this.config?.contractAddress || ('0x0' as `0x${string}`),
          latencyMs: Date.now() - startTime,
          error: 'PublicClient not initialized',
        };
      }
      const block = await this.publicClient.getBlock({ blockTag: 'latest' });
      return {
        status: 'up' as const,
        network: 'Base Sepolia',
        chainId: baseSepolia.id,
        contractAddress: this.config.contractAddress,
        latestBlock: Number(block.number),
        blockTimestamp: Number(block.timestamp),
        latencyMs: Date.now() - startTime,
      };
    } catch (err: unknown) {
      return {
        status: 'down' as const,
        network: 'Base Sepolia',
        chainId: baseSepolia.id,
        contractAddress: this.config?.contractAddress || ('0x0' as `0x${string}`),
        latencyMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : 'Failed to query RPC provider',
      };
    }
  }

  /**
   * Calls `startInspection(bytes32 dealId)` on-chain after strictly validating on-chain Deposited state.
   */
  async startInspection(dealId: string): Promise<TxResult | null> {
    const bytes32Id = this._toDealIdBytes32(dealId);
    this.logger.log(`[startInspection] dealId=${dealId} bytes32Id=${bytes32Id}`);

    // Pre-flight check: query on-chain state to prevent reverting simulation
    try {
      const dealData = (await this.publicClient.readContract({
        address: this.config.contractAddress,
        abi: DIGITAL_ESCROW_ABI,
        functionName: 'getDeal',
        args: [bytes32Id],
      })) as [{ [k: string]: unknown }, { state: number } | [number, ...unknown[]]];

      const stateData = dealData[1];
      const onChainState = typeof stateData === 'object' && 'state' in stateData
        ? Number(stateData.state)
        : Array.isArray(stateData)
          ? Number(stateData[0])
          : Number(stateData);

      if (onChainState === ONCHAIN_DEAL_STATE.IN_INSPECTION) {
        this.logger.warn(`[startInspection] Deal ${dealId} already IN_INSPECTION on-chain (state: ${onChainState}). Syncing DB.`);
        await this.prisma.deal.update({
          where: { id: dealId },
          data: { state: DealState.IN_INSPECTION },
        });
        return null;
      }

      if (onChainState !== ONCHAIN_DEAL_STATE.DEPOSITED) {
        this.logger.warn(
          `[startInspection] Deal ${dealId} on-chain state is ${onChainState} (expected DEPOSITED=${ONCHAIN_DEAL_STATE.DEPOSITED}). Aborting on-chain call to prevent revert.`,
        );
        return null;
      }
    } catch (readErr: unknown) {
      const msg = readErr instanceof Error ? readErr.message : String(readErr);
      this.logger.error(`[startInspection] Failed to read on-chain state for dealId=${dealId}: ${msg}`);
      return null;
    }

    return this._sendTx('startInspection', [bytes32Id], async (txHash, receipt) => {
      await this.prisma.deal.update({
        where: { id: dealId },
        data: { state: DealState.IN_INSPECTION, settleTxHash: txHash },
      });
      this.logger.log(`[startInspection] DB updated → IN_INSPECTION | txHash=${txHash} | block=${receipt.blockNumber}`);
    });
  }

  /**
   * Calls `settle(bytes32 dealId)` on-chain.
   */
  async settle(dealId: string): Promise<TxResult | null> {
    const bytes32Id = this._toDealIdBytes32(dealId);
    this.logger.log(`[settle] dealId=${dealId}`);

    return this._sendTx('settle', [bytes32Id], async (txHash, receipt) => {
      await this.prisma.deal.update({
        where: { id: dealId },
        data: { state: DealState.SETTLED, settleTxHash: txHash },
      });
      this.logger.log(`[settle] DB updated → SETTLED | txHash=${txHash} | block=${receipt.blockNumber}`);
    });
  }

  /**
   * Calls `resolveDispute(bytes32 dealId, bool refundBuyer)` on-chain.
   */
  async resolveDispute(dealId: string, action: DisputeAction): Promise<TxResult | null> {
    if (action === 'ESCALATE_TO_ADMIN') {
      this.logger.warn(`[resolveDispute] ESCALATE_TO_ADMIN for dealId=${dealId} — skipping on-chain tx`);
      return null;
    }

    const refundBuyer = action === 'TRIGGER_REFUND';
    const bytes32Id = this._toDealIdBytes32(dealId);
    this.logger.log(`[resolveDispute] dealId=${dealId} action=${action} refundBuyer=${refundBuyer}`);

    return this._sendTx('resolveDispute', [bytes32Id, refundBuyer], async (txHash, receipt) => {
      const newState = refundBuyer ? DealState.REFUNDED : DealState.SETTLED;
      await this.prisma.deal.update({
        where: { id: dealId },
        data: { state: newState, disputeTxHash: txHash },
      });
      this.logger.log(`[resolveDispute] DB updated → ${newState} | txHash=${txHash} | block=${receipt.blockNumber}`);
    });
  }

  /**
   * Generic signed transaction sender with mutex locking and pre-simulation.
   */
  private async _sendTx<TArgs extends readonly unknown[]>(
    functionName: string,
    args: TArgs,
    onSuccess: (txHash: Hash, receipt: TransactionReceipt) => Promise<void>,
  ): Promise<TxResult | null> {
    const release = await this.mutex.acquire();

    try {
      const account = privateKeyToAccount(this.config.privateKey);

      // 1. Simulate call to detect reverts without wasting gas
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
        this.logger.error(`[${functionName}] Simulation reverted — reason: ${reason}`);
        return null;
      }

      // 2. Fetch pending nonce
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

      // 4. Await receipt
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: txHash,
        confirmations: 1,
        timeout: 120_000,
      });

      if (receipt.status === 'reverted') {
        this.logger.error(`[${functionName}] On-chain REVERT | txHash=${txHash} | block=${receipt.blockNumber}`);
        return null;
      }

      // 5. DB Callback
      await onSuccess(txHash, receipt);
      return { txHash, receipt };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`[${functionName}] Unexpected error: ${msg}`, stack);
      return null;
    } finally {
      release();
    }
  }

  /**
   * Converts a UUID or hex string into a 32-byte 0x-prefixed hex string.
   */
  private _toDealIdBytes32(dealId: string): `0x${string}` {
    if (/^0x[0-9a-fA-F]{64}$/.test(dealId)) {
      return dealId as `0x${string}`;
    }
    const cleanHex = dealId.replace(/-/g, '').replace(/^0x/, '');
    if (cleanHex.length === 32) {
      return `0x${cleanHex.padEnd(64, '0')}`;
    }
    if (cleanHex.length === 64) {
      return `0x${cleanHex}`;
    }
    throw new Error(
      `[OracleRelayer] Invalid dealId format — expected UUID (32 hex chars) or 32-byte hex string (64 chars), got: ${dealId}`,
    );
  }

  /**
   * Decodes revert error reason using complete EIP-6093 ABI definitions.
   */
  private _decodeRevertReason(error: unknown): string {
    try {
      if (error && typeof error === 'object' && 'data' in error && typeof error.data === 'string') {
        const data = (error as { data: string }).data as `0x${string}`;
        const decoded = decodeErrorResult({ abi: DIGITAL_ESCROW_ABI, data });
        return `${decoded.errorName}(${JSON.stringify(decoded.args)})`;
      }
    } catch {
      // Fallback to error message
    }
    return error instanceof Error ? error.message : String(error);
  }

  async getPendingNonce(): Promise<number> {
    const account = privateKeyToAccount(this.config.privateKey);
    return this.publicClient.getTransactionCount({
      address: account.address,
      blockTag: 'pending',
    });
  }

  getRelayerAddress(): string {
    return privateKeyToAccount(this.config.privateKey).address;
  }

  encodeCalldata(
    functionName: 'startInspection' | 'settle' | 'resolveDispute',
    args: readonly unknown[],
  ): `0x${string}` {
    return encodeFunctionData({
      abi: DIGITAL_ESCROW_ABI,
      functionName: functionName as any,
      args: args as any,
    });
  }
}
