import { DealState, ArbitrationVerdict } from '@prisma/client';

export type TvlTimeframe = '7d' | '30d' | '90d' | 'all';

export interface TvlDataPoint {
  date: string;
  vndLocked: number;
  vndVolume: number;
  ethLocked: number;
  ethVolume: number;
  dealCount: number;
}

export interface DealDistributionItem {
  state: DealState;
  label: string;
  count: number;
  percentage: number;
  totalAmountVnd: number;
  color: string;
}

export interface ConfidenceTierBreakdown {
  low: { count: number; percentage: number }; // < 0.60
  medium: { count: number; percentage: number }; // 0.60 - 0.74
  high: { count: number; percentage: number }; // >= 0.75 (Auto-resolution standard)
}

export interface DisputeAiMetrics {
  totalDisputes: number;
  resolvedDisputes: number;
  resolutionRatePct: number;
  verdictDistribution: {
    approvePayout: number;
    triggerRefund: number;
    escalateToAdmin: number;
  };
  avgConfidenceScore: number;
  confidenceTiers: ConfidenceTierBreakdown;
  adminOverrideCount: number;
  adminOverrideRatePct: number;
  autonomousResolutionRatePct: number;
}

export interface KpiOverview {
  lockedTvlVnd: number;
  lockedTvlEth: number;
  totalVolumeVnd: number;
  totalVolumeEth: number;
  totalDeals: number;
  activeEscrowDeals: number;
  disputeRatePct: number;
  autonomousResolutionRatePct: number;
}

export interface CacheMetadata {
  cachedAt: string;
  expiresAt: string;
  ttlSeconds: number;
  isStale: boolean;
}

export interface AnalyticsOverviewResponse {
  kpis: KpiOverview;
  tvlTimeseries: TvlDataPoint[];
  dealDistribution: DealDistributionItem[];
  disputeMetrics: DisputeAiMetrics;
  cacheMetadata: CacheMetadata;
}

