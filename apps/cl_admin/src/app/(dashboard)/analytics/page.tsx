"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  RotateCw,
  Lock,
  TrendingUp,
  ShieldAlert,
  Bot,
  Clock,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { formatVndCurrency, formatEthCurrency } from "@/components/analytics/custom-chart-tooltip";
import type {
  AnalyticsOverviewResponse,
  TvlTimeframe,
} from "@/types/analytics";

// Safe dynamic imports for charts with Skeleton fallbacks to eliminate Hydration Mismatch
const TvlAreaChart = dynamic(
  () =>
    import("@/components/analytics/tvl-area-chart").then(
      (mod) => mod.TvlAreaChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-95 w-full animate-pulse rounded-xl border border-slate-800 bg-cyber-surface/80" />
    ),
  },
);

const DealDistributionChart = dynamic(
  () =>
    import("@/components/analytics/deal-distribution-chart").then(
      (mod) => mod.DealDistributionChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-95 w-full animate-pulse rounded-xl border border-slate-800 bg-cyber-surface/80" />
    ),
  },
);

const AiDisputeMetricsCard = dynamic(
  () =>
    import("@/components/analytics/ai-dispute-metrics-card").then(
      (mod) => mod.AiDisputeMetricsCard,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-95 w-full animate-pulse rounded-xl border border-slate-800 bg-cyber-surface/80" />
    ),
  },
);

const DEFAULT_OVERVIEW: AnalyticsOverviewResponse = {
  kpis: {
    lockedTvlVnd: 0,
    lockedTvlEth: 0,
    totalVolumeVnd: 0,
    totalVolumeEth: 0,
    totalDeals: 0,
    activeEscrowDeals: 0,
    disputeRatePct: 0,
    autonomousResolutionRatePct: 100,
  },
  tvlTimeseries: [],
  dealDistribution: [],
  disputeMetrics: {
    totalDisputes: 0,
    resolvedDisputes: 0,
    resolutionRatePct: 100,
    verdictDistribution: {
      approvePayout: 0,
      triggerRefund: 0,
      escalateToAdmin: 0,
    },
    avgConfidenceScore: 0,
    confidenceTiers: {
      low: { count: 0, percentage: 0 },
      medium: { count: 0, percentage: 0 },
      high: { count: 0, percentage: 0 },
    },
    adminOverrideCount: 0,
    adminOverrideRatePct: 0,
    autonomousResolutionRatePct: 100,
  },
  cacheMetadata: {
    cachedAt: new Date().toISOString(),
    expiresAt: new Date().toISOString(),
    ttlSeconds: 60,
    isStale: false,
  },
};

export default function AnalyticsDashboardPage() {
  const [data, setData] = React.useState<AnalyticsOverviewResponse>(DEFAULT_OVERVIEW);
  const [timeframe, setTimeframe] = React.useState<TvlTimeframe>("30d");
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);
  const [countdown, setCountdown] = React.useState<number>(60);
  const [lastSyncTime, setLastSyncTime] = React.useState<string>("");

  const fetchData = React.useCallback(
    async (forceFresh = false) => {
      try {
        if (forceFresh) {
          setIsRefreshing(true);
          await apiClient("/api/v1/analytics/cache/invalidate", {
            method: "POST",
          }).catch(() => {});
        } else {
          setIsLoading(true);
        }

        const res = await apiClient<AnalyticsOverviewResponse>(
          `/api/v1/analytics/overview?timeframe=${timeframe}`,
        );

        if (res && res.kpis) {
          setData(res);
          setCountdown(res.cacheMetadata?.ttlSeconds || 60);
          setLastSyncTime(
            new Date().toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
          );
        }
      } catch {
        // Safe graceful degradation with fallback state
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [timeframe],
  );

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      void fetchData(false);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [fetchData]);

  // Countdown timer for 60s in-memory cache
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 60));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { kpis, tvlTimeseries, dealDistribution, disputeMetrics } = data;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Refresh Bar */}
      <div className="flex flex-col gap-3 border-b border-slate-200/80 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="text-slate-500">Command Center</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-semibold">Phân tích &amp; Thống kê</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Hệ thống đối soát dòng tiền ký quỹ, trạng thái luân chuyển và chất lượng phán quyết AI Arbitrator
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5 text-slate-600" />
            <span>Cache:</span>
            <span className="font-mono font-semibold text-slate-800">
              {countdown}s
            </span>
            {lastSyncTime && (
              <span className="hidden sm:inline text-slate-400 font-mono">
                • {lastSyncTime}
              </span>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchData(true)}
            disabled={isRefreshing}
            className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 gap-1.5 h-8.5 px-3 text-xs shadow-2xs cursor-pointer"
          >
            <RotateCw
              className={`h-3.5 w-3.5 text-slate-600 ${isRefreshing ? "animate-spin text-slate-900" : ""}`}
            />
            <span className="text-xs font-medium">Làm mới</span>
          </Button>
        </div>
      </div>

      {/* 4 Executive KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Locked TVL */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 font-mono uppercase tracking-wider">
              TVL Đang Khóa Ký Quỹ
            </span>
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-1.5 text-emerald-700">
              <Lock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {formatVndCurrency(kpis.lockedTvlVnd)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>+ {formatEthCurrency(kpis.lockedTvlEth)}</span>
            <span>{kpis.activeEscrowDeals} deal giữ quỹ</span>
          </div>
        </div>

        {/* KPI 2: Total Volume */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 font-mono uppercase tracking-wider">
              Volume Luân Chuyển
            </span>
            <div className="rounded-lg bg-slate-100 border border-slate-200 p-1.5 text-slate-700">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {formatVndCurrency(kpis.totalVolumeVnd)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>+ {formatEthCurrency(kpis.totalVolumeEth)}</span>
            <span>{kpis.totalDeals} deals toàn sàn</span>
          </div>
        </div>

        {/* KPI 3: Dispute Rate */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 font-mono uppercase tracking-wider">
              Tỷ Lệ Tranh Chấp Sàn
            </span>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-1.5 text-amber-700">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-amber-600 tabular-nums">
            {kpis.disputeRatePct}%
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>{disputeMetrics.totalDisputes} ca khiếu nại</span>
            <span className="text-slate-600 font-semibold">{disputeMetrics.resolutionRatePct}% giải quyết</span>
          </div>
        </div>

        {/* KPI 4: Autonomous Resolution Rate */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 font-mono uppercase tracking-wider">
              Tự Động Phán Quyết (AI)
            </span>
            <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-1.5 text-indigo-700">
              <Bot className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tracking-tight text-indigo-600 tabular-nums">
            {kpis.autonomousResolutionRatePct}%
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>{disputeMetrics.confidenceTiers.high.count} ca chuẩn ≥ 0.75</span>
            <span>Override {disputeMetrics.adminOverrideRatePct}%</span>
          </div>
        </div>
      </div>

      {/* Main Row: TVL Timeseries Area Chart */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <TvlAreaChart
          data={tvlTimeseries}
          timeframe={timeframe}
          onTimeframeChange={(tf) => setTimeframe(tf)}
          isLoading={isLoading}
        />
      </div>

      {/* Secondary Row: Deal Lifecycle Distribution + AI Dispute Arbitration */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <DealDistributionChart
            data={dealDistribution}
            isLoading={isLoading}
          />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <AiDisputeMetricsCard
            metrics={disputeMetrics}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}

