/**
 * relayer.types.ts
 * Type definitions and Anchor discriminators for TrustPassz Dual-chain Relayer.
 */

import type { Deal } from '@prisma/client';

export type DualChainType = 'BASE_SEPOLIA' | 'SOLANA_DEVNET' | 'SOLANA_MAINNET';

export type DualDisputeAction =
  | 'APPROVE_PAYOUT'
  | 'TRIGGER_REFUND'
  | 'ESCALATE_TO_ADMIN';

export interface DealWithDualChain extends Deal {
  chainType: DualChainType;
  solanaPdaAddress: string | null;
  buyerWallet: string | null;
  sellerWallet: string | null;
  depositTxHash: string | null;
}

export interface UnifiedTxResult {
  chainType: DualChainType;
  txHash: string;
  dealId: string;
  targetState: string;
  blockOrSlot?: number;
  error?: string;
}

export interface SolanaDepositParsedEvent {
  dealIdHex: string;
  dealIdBase58: string;
  dealIdRaw: Uint8Array;
  buyer: string;
  seller: string;
  amountLamports: bigint;
  depositedAt: number;
  signature: string;
  pdaAddress: string;
}

/**
 * Anchor 8-byte instruction discriminators calculated via sha256("global:<name>").slice(0, 8)
 */
export const ANCHOR_DISCRIMINATORS = {
  create_and_deposit: Buffer.from([149, 232, 62, 162, 238, 69, 34, 47]),
  start_inspection: Buffer.from([102, 155, 201, 238, 184, 61, 73, 206]),
  settle: Buffer.from([175, 42, 185, 87, 144, 131, 102, 212]),
  cancel_deposited: Buffer.from([253, 31, 190, 63, 14, 114, 18, 1]),
  resolve_dispute: Buffer.from([231, 6, 202, 6, 96, 103, 12, 230]),
} as const;

export interface SolanaRelayerConfig {
  rpcUrl: string;
  wsUrl?: string;
  programId: string;
  relayerPrivateKeyBase58?: string;
  commitment: 'processed' | 'confirmed' | 'finalized';
}
