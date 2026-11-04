import type { Deal, DisputeLog, ArbitrationVerdict } from './index';

export type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'NORMAL';

export interface DisputeWorkbenchItem extends DisputeLog {
  urgencyLevel: UrgencyLevel;
  isUnderConfidenceThreshold: boolean;
  hoursRemaining: number;
  amountVnd: number;
}

export type DisputeSortOption =
  | 'confidence_asc'
  | 'confidence_desc'
  | 'urgency_desc'
  | 'amount_desc'
  | 'created_desc';

export interface EmergencyFilterState {
  uncertainOnly: boolean;
  confidenceThreshold: number;
  urgentOnly: boolean;
  highValueOnly: boolean;
  pendingAdminOnly: boolean;
  searchQuery: string;
  sortBy: DisputeSortOption;
}

export type EvidenceMediaType = 'image' | 'video' | 'log' | 'archive';

export interface EvidenceMediaItem {
  id: string;
  url: string;
  storagePath?: string;
  bucket: 'dispute-evidences';
  title: string;
  type: EvidenceMediaType;
  sizeBytes?: number;
  mimeType?: string;
  hash?: string;
  uploadedAt?: string;
  blurDataUrl?: string;
}

export interface SellerAssetEvidence {
  title: string;
  description: string;
  contentHash: string;
  fileName: string;
  fileSizeBytes?: number;
  assetType: string;
  previewUrls: EvidenceMediaItem[];
  rawCredentials?: string;
  sellerDisplayName: string;
  sellerWallet: string;
}

export interface BuyerDisputeEvidence {
  reason: string;
  rawLogs: string;
  screenshots: EvidenceMediaItem[];
  unboxingKeyframes: EvidenceMediaItem[];
  claimantWallet: string;
  submittedAt: string;
}

export interface EvidenceComparisonPair {
  dealId: string;
  disputeId: string;
  deal: Deal;
  dispute: DisputeLog;
  sellerAsset: SellerAssetEvidence;
  buyerDispute: BuyerDisputeEvidence;
}

export interface AuditNoteDraft {
  dealId: string;
  disputeId: string;
  resolutionNote: string;
  lastSavedAt: string;
  targetVerdict?: ArbitrationVerdict;
}

export interface ZoomTransformState {
  scale: number;
  offsetX: number;
  offsetY: number;
  brightness: number;
  contrast: number;
}

export interface PiiRedactionResult {
  sanitizedText: string;
  detectedCount: number;
  detectedCategories: string[];
}

