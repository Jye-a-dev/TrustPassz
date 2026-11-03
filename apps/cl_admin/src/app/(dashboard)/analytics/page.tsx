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
      <div className="flex flex-col gap-4 rounded-xl border border-slate-800/80 bg-cyber-surface/90 p-5 shadow-xl backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-100 sm:text-2xl">
              Phân tích Dữ liệu & Thống kê Escrow
            </h1>
            <span className="rounded-full bg-emerald-950/60 border border-emerald-700/50 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
              Live Engine
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400 sm:text-sm">
            Hệ thống đối soát dòng tiền ký quỹ, trạng thái luân chuyển và chất lượng phán quyết AI Arbitrator
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-400">
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            <span>Cache:</span>
            <span className="font-mono font-semibold text-slate-200">
              {countdown}s
            </span>
            {lastSyncTime && (
              <span className="hidden sm:inline text-slate-500">
                • {lastSyncTime}
              </span>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchData(true)}
            disabled={isRefreshing}
            className="border-slate-700/80 bg-slate-800/80 hover:bg-slate-700 hover:text-white text-slate-200 gap-2 min-h-11 min-w-11 px-3.5 touch-manipulation"
          >
            <RotateCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`}
            />
            <span className="text-xs font-medium">Làm mới</span>
          </Button>
        </div>
      </div>

      {/* 4 Executive KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Locked TVL */}
        <div className="relative overflow-hidden rounded-xl border border-slate-800/80 bg-cyber-surface/90 p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              TVL Đang Khóa Ký Quỹ
            </span>
            <div className="rounded-lg bg-cyan-950/60 border border-cyan-800/40 p-2 text-cyan-400">
              <Lock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-xl font-bold tracking-tight text-cyan-300">
            {formatVndCurrency(kpis.lockedTvlVnd)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="font-mono text-slate-400">
              + {formatEthCurrency(kpis.lockedTvlEth)}
            </span>
            <span className="text-slate-500">
              {kpis.activeEscrowDeals} deal giữ quỹ
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-linear-to-r from-cyan-500/0 via-cyan-500 to-cyan-500/0" />
        </div>

        {/* KPI 2: Total Volume */}
        <div className="relative overflow-hidden rounded-xl border border-slate-800/80 bg-cyber-surface/90 p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Volume Luân Chuyển Lũy Kế
            </span>
            <div className="rounded-lg bg-emerald-950/60 border border-emerald-800/40 p-2 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-xl font-bold tracking-tight text-emerald-300">
            {formatVndCurrency(kpis.totalVolumeVnd)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="font-mono text-slate-400">
              + {formatEthCurrency(kpis.totalVolumeEth)}
            </span>
            <span className="text-slate-500">
              {kpis.totalDeals} deals toàn sàn
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-linear-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0" />
        </div>

        {/* KPI 3: Dispute Rate */}
        <div className="relative overflow-hidden rounded-xl border border-slate-800/80 bg-cyber-surface/90 p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Tỷ Lệ Tranh Chấp Sàn
            </span>
            <div className="rounded-lg bg-amber-950/60 border border-amber-800/40 p-2 text-amber-400">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-xl font-bold tracking-tight text-amber-300">
            {kpis.disputeRatePct}%
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              {disputeMetrics.totalDisputes} ca khiếu nại
            </span>
            <span className="text-slate-500">
              {disputeMetrics.resolutionRatePct}% đã khép lại
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-linear-to-r from-amber-500/0 via-amber-500 to-amber-500/0" />
        </div>

        {/* KPI 4: Autonomous Resolution Rate */}
        <div className="relative overflow-hidden rounded-xl border border-slate-800/80 bg-cyber-surface/90 p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Tự Động Phán Quyết (AI)
            </span>
            <div className="rounded-lg bg-cyan-950/60 border border-cyan-800/40 p-2 text-cyan-400">
              <Bot className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-xl font-bold tracking-tight text-cyan-300">
            {kpis.autonomousResolutionRatePct}%
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              {disputeMetrics.confidenceTiers.high.count} ca chuẩn ≥ 0.75
            </span>
            <span className="text-slate-500">
              Override {disputeMetrics.adminOverrideRatePct}%
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-linear-to-r from-cyan-500/0 via-cyan-500 to-cyan-500/0" />
        </div>
      </div>

      {/* Main Row: TVL Timeseries Area Chart */}
      <div>
        <TvlAreaChart
          data={tvlTimeseries}
          timeframe={timeframe}
          onTimeframeChange={(tf) => setTimeframe(tf)}
          isLoading={isLoading}
        />
      </div>

      {/* Secondary Row: Deal Lifecycle Distribution + AI Dispute Arbitration */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DealDistributionChart
          data={dealDistribution}
          isLoading={isLoading}
        />
        <AiDisputeMetricsCard
          metrics={disputeMetrics}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

