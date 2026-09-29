export interface VaultDigitalAsset {
  id: string;
  assetType: string;
  encryptedContent: string;
  encryptionIv: string;
  authTag: string;
  contentHash: string;
  fileName?: string;
  fileSizeBytes?: number;
  maxAccessLimit: number;
  accessCount: number;
}

export interface DealDetail {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  state: "PENDING" | "DEPOSITED" | "IN_INSPECTION" | "SETTLED" | "REFUNDED" | "DISPUTED";
  inspectionDuration: number;
  depositedAt?: string;
  seller?: {
    id: string;
    displayName: string;
  };
  digitalAsset?: VaultDigitalAsset;
}
