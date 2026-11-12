export type UserRole =
  | 'USER'
  | 'SELLER'
  | 'BUYER'
  | 'ARBITRATOR'
  | 'ADMIN'
  | 'SUPER_ADMIN';

export type DealState =
  | 'PENDING'
  | 'DEPOSITED'
  | 'IN_INSPECTION'
  | 'SETTLED'
  | 'REFUNDED'
  | 'DISPUTED';

export type AssetType =
  | 'SOURCE_CODE'
  | 'LICENSE_KEY'
  | 'ACCOUNT_CREDENTIAL'
  | 'DESIGN_ASSET'
  | 'OTHER';

export type DisputeStatus =
  | 'OPENED'
  | 'AI_PROCESSING'
  | 'AI_RESOLVED'
  | 'ADMIN_ESCALATED'
  | 'CLOSED';

export type ArbitrationVerdict =
  | 'APPROVE_PAYOUT'
  | 'TRIGGER_REFUND'
  | 'ESCALATE_TO_ADMIN';

export interface AdminUser {
  id: string;
  email?: string | null;
  phone?: string | null;
  displayName?: string | null;
  walletAddress?: string | null;
  role: UserRole;
  avatarUrl?: string | null;
  isFrozen?: boolean;
  kycStatus?: string;
  totalDeals?: number;
  totalDisputes?: number;
  disputeRate?: number;
  walletBalanceSol?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface FiatFundingOrderRecord {
  id: string;
  orderCode: string;
  adminId?: string | null;
  recipientWallet: string;
  fiatCurrency: 'VND' | 'USD';
  fiatAmount: number;
  cryptoCurrency: string;
  cryptoAmount: number;
  exchangeRate: number;
  status: 'PENDING' | 'PAID' | 'FULFILLED' | 'FAILED' | 'CANCELLED';
  paymentGateway: string;
  paymentRefId?: string | null;
  qrUrl?: string | null;
  solanaTxHash?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export interface DigitalAsset {
  id: string;
  dealId: string;
  assetType: AssetType;
  fileName?: string;
  fileSizeBytes?: number | string;
  contentHash?: string;
  accessCount: number;
  maxAccessLimit: number;
  unlockedAt?: string;
  createdAt: string;
}

export interface Deal {
  id: string;
  onchainDealId?: string;
  sellerId: string;
  buyerId?: string;
  title: string;
  description?: string;
  amount: string | number;
  currency: string;
  state: DealState;
  inspectionDuration: number;
  depositedAt?: string;
  inspectionDeadline?: string;
  paymentOrderCode?: number | string;
  paymentRefId?: string;
  settleTxHash?: string;
  disputeTxHash?: string;
  createdAt: string;
  updatedAt: string;
  seller?: {
    id?: string;
    displayName?: string;
    walletAddress?: string;
    email?: string;
  };
  buyer?: {
    id?: string;
    displayName?: string;
    walletAddress?: string;
    email?: string;
  };
  digitalAsset?: DigitalAsset;
}

export interface DisputeLog {
  id: string;
  dealId: string;
  initiatorId: string;
  status: DisputeStatus;
  reason: string;
  evidenceUrls: string[];
  aiVerdict?: ArbitrationVerdict;
  aiConfidenceScore?: number;
  aiExplanation?: string;
  aiAnalyzedAt?: string;
  adminVerdict?: ArbitrationVerdict;
  resolvedById?: string;
  resolutionNote?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  deal?: Deal;
  initiator?: {
    id?: string;
    displayName?: string;
    walletAddress?: string;
    email?: string;
  };
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetEntity: string;
  targetId: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  timestamp: string;
}

export interface SystemPillarStatus {
  id: string;
  name: string;
  environment?: 'local' | 'deployed';
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  endpoint: string;
  httpStatus?: number;
  sslActive?: boolean;
  details: Record<string, string | number | boolean>;
  lastChecked: string;
}

export interface RelayerBalanceInfo {
  relayerAddress: string;
  balanceSol: number;
  balanceLamports: string;
  thresholdSol: number;
  isLowBalance: boolean;
  network: string;
  timestamp: string;
}

export interface ConfirmFundingPayload {
  txHash: string;
  senderWallet: string;
  amountSol: number;
  twoFactorCode?: string;
}

export interface ConfirmFundingResult {
  success: boolean;
  message: string;
  txHash: string;
  amountSol: number;
  amountLamports: string;
  senderWallet: string;
  relayerAddress: string;
  newBalanceSol: number;
  recordedAt: string;
}

export * from './emergency-alert';

