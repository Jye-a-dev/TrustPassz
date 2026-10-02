export type Role = 'USER' | 'SELLER' | 'BUYER' | 'ADMIN';

export interface User {
  id: string;
  email?: string;
  walletAddress?: string;
  displayName: string;
  avatarUrl?: string;
  role: Role;
}

export interface AuthResponse {
  tokenType: string;
  accessToken: string;
  expiresIn: number;
  user: User;
}

export type DealState =
  | 'PENDING'
  | 'DEPOSITED'
  | 'IN_INSPECTION'
  | 'SETTLED'
  | 'REFUNDED'
  | 'DISPUTED';

export interface DigitalAsset {
  id: string;
  dealId: string;
  assetType: string;
  encryptedContent?: string;
  encryptionIv?: string;
  authTag?: string;
  contentHash?: string;
  fileName: string;
  fileSizeBytes?: string;
  accessCount?: number;
  maxAccessLimit?: number;
}

export interface Deal {
  id: string;
  sellerId: string;
  buyerId?: string | null;
  title: string;
  description?: string;
  amount: string | number;
  currency: string;
  state: DealState;
  inspectionDuration: number;
  inspectionEndsAt?: string | null;
  onchainDealId?: string | null;
  paymentOrderCode?: number | null;
  settleTxHash?: string | null;
  disputeTxHash?: string | null;
  createdAt: string;
  updatedAt: string;
  seller?: Partial<User>;
  buyer?: Partial<User>;
  digitalAsset?: DigitalAsset | null;
}

export interface HealthStatus {
  status: 'ok' | 'offline';
  service: string;
  timestamp: string;
  latencyMs: number;
}

export interface UnlockedVaultPayload {
  dealId: string;
  assetType: string;
  fileName: string;
  fileSizeBytes?: string;
  encryptedPayload: string;
  iv: string;
  authTag: string;
  accessCount: number;
  maxAccessLimit: number;
  decryptedKeyOrUrl?: string;
}

export interface DisputeCreationPayload {
  dealId: string;
  initiatorId: string;
  reason: string;
  evidenceUrls?: string[];
}

