export type EscrowDealState =
  | "PENDING"
  | "DEPOSITED"
  | "IN_INSPECTION"
  | "SETTLED"
  | "REFUNDED"
  | "DISPUTED";

export type DisputeStatus =
  | "OPENED"
  | "AI_PROCESSING"
  | "AI_RESOLVED"
  | "ADMIN_ESCALATED"
  | "CLOSED";

export type ArbitrationVerdict =
  | "APPROVE_PAYOUT"
  | "TRIGGER_REFUND"
  | "ESCALATE_TO_ADMIN";

export type ChainType =
  | "BASE_SEPOLIA"
  | "SOLANA_DEVNET"
  | "SOLANA_MAINNET";

export interface EscrowParticipant {
  id: string;
  displayName?: string | null;
  email?: string | null;
  walletAddress?: string | null;
  avatarUrl?: string | null;
}

export interface DigitalAssetSummary {
  id: string;
  assetType: string;
  contentHash?: string | null;
  fileName?: string | null;
  fileSizeBytes?: string | number | null;
  unlockedAt?: string | null;
}

export interface EscrowReceiptData {
  dealId: string;
  title: string;
  description?: string | null;
  amount: number;
  feeAmount: number;
  currency: string;
  chainType: ChainType;
  state: EscrowDealState;
  paymentOrderCode?: number | string | null;
  paymentRefId?: string | null;
  depositTxHash?: string | null;
  settleTxHash?: string | null;
  disputeTxHash?: string | null;
  seller: EscrowParticipant;
  buyer?: EscrowParticipant | null;
  digitalAsset?: DigitalAssetSummary | null;
  inspectionDuration: number;
  depositedAt?: string | null;
  inspectionDeadline?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DisputeRecord {
  id: string;
  dealId: string;
  initiatorId: string;
  status: DisputeStatus;
  reason: string;
  evidenceUrls: string[];
  aiVerdict?: ArbitrationVerdict | null;
  aiConfidenceScore?: number | string | null;
  aiExplanation?: string | null;
  aiAnalyzedAt?: string | null;
  adminVerdict?: ArbitrationVerdict | null;
  resolvedById?: string | null;
  resolvedBy?: {
    id: string;
    displayName?: string | null;
    role?: string | null;
  } | null;
  resolutionNote?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TimelineStepId =
  | "DEPOSIT"
  | "INSPECTION"
  | "DISPUTE_RAISED"
  | "AI_ARBITRATION"
  | "FINAL_SETTLEMENT";

export type TimelineStepStatus =
  | "completed"
  | "in_progress"
  | "pending"
  | "failed"
  | "skipped";

export interface TimelineStepData {
  id: TimelineStepId;
  stepNumber: number;
  title: string;
  subtitle: string;
  timestamp?: string | null;
  status: TimelineStepStatus;
  description: string;
  details?: {
    txHash?: string | null;
    evidenceUrls?: string[];
    aiConfidenceScore?: number | null;
    aiVerdict?: ArbitrationVerdict | null;
    aiExplanation?: string | null;
    adminVerdict?: ArbitrationVerdict | null;
    resolutionNote?: string | null;
    resolvedAt?: string | null;
    settlementAction?: "PAYOUT" | "REFUND" | "ADMIN_OVERRIDE" | null;
  };
}

