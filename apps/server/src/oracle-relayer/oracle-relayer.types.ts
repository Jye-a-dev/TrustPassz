/**
 * oracle-relayer.types.ts
 * Type definitions and client interfaces for Oracle Relayer service.
 */

import type { Hash, TransactionReceipt } from 'viem';

export type DisputeAction =
  'APPROVE_PAYOUT' | 'TRIGGER_REFUND' | 'ESCALATE_TO_ADMIN';

export interface TxResult {
  txHash: Hash;
  receipt: TransactionReceipt;
}

export interface ViemPublicClient {
  simulateContract(args: any): Promise<unknown>;
  getTransactionCount(args: {
    address: `0x${string}`;
    blockTag: 'pending';
  }): Promise<number>;
  waitForTransactionReceipt(args: {
    hash: Hash;
    confirmations?: number;
    timeout?: number;
  }): Promise<TransactionReceipt>;
}

export interface ViemWalletClient {
  writeContract(args: any): Promise<Hash>;
}
