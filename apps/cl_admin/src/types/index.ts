export type UserRole = 'USER' | 'SELLER' | 'BUYER' | 'ARBITRATOR' | 'ADMIN';

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
  email: string;
  displayName: string;
  walletAddress?: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
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
  id: 'cl_user' | 'server' | 'cl_admin' | 'pipeline' | 'contract';
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  endpoint: string;
  details: Record<string, string | number | boolean>;
  lastChecked: string;
}
