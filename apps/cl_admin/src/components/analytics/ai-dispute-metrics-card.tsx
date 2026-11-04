"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useMounted } from "@/hooks/use-mounted";
import { DisputeAiMetrics } from "@/types/analytics";
import { CustomChartTooltip } from "./custom-chart-tooltip";
import { Bot, Cpu, AlertTriangle, CheckCircle2 } from "lucide-react";

interface AiDisputeMetricsCardProps {
  metrics: DisputeAiMetrics;
  isLoading?: boolean;
}

export function AiDisputeMetricsCard({
  metrics,
  isLoading = false,
}: AiDisputeMetricsCardProps) {
  const isMounted = useMounted();

  if (!isMounted || isLoading) {
    return (
      <div className="flex h-95 w-full flex-col justify-between rounded-xl border border-slate-800/80 bg-cyber-surface/90 p-5 backdrop-blur-md">
        <div className="h-5 w-44 animate-pulse rounded bg-slate-800" />
        <div className="h-70 w-full animate-pulse rounded bg-slate-900/50" />
      </div>
    );
  }

  const chartData = [
    {
      name: "Giải ngân Seller",
      key: "approvePayout",
      count: metrics.verdictDistribution.approvePayout,
      fill: "#10B981", // Emerald
    },
    {
      name: "Hoàn tiền Buyer",
      key: "triggerRefund",
      count: metrics.verdictDistribution.triggerRefund,
      fill: "#06B6D4", // Cyan
    },
    {
      name: "Chuyển Admin",
      key: "escalateToAdmin",
      count: metrics.verdictDistribution.escalateToAdmin,
      fill: "#F59E0B", // Amber
    },
  ];

  return (
    <div className="flex w-full flex-col rounded-xl border border-slate-800/80 bg-cyber-surface/90 p-5 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-cyan-400" />
            <h3 className="text-base font-semibold text-slate-100">
              Chỉ số Trọng tài AI & Phán quyết
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Hiệu suất phân xử tự động, độ tin cậy và tỷ lệ can thiệp nhân sự
          </p>
        </div>

        {/* Confidence Badge */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5">
          <Cpu className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-xs text-slate-400">Điểm tin cậy TB:</span>
          <span className="font-mono text-sm font-bold text-cyan-300">
            {(metrics.avgConfidenceScore * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Main Grid: Bar Chart + Performance Indicators */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Side: Verdict Distribution BarChart */}
        <div className="h-55 w-full lg:col-span-7">
          <div className="mb-2 text-xs font-medium text-slate-400">
            Phân bổ phán quyết ban hành bởi AI Arbitrator
          </div>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 25, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1E293B"
                horizontal={false}
              />
              <XAxis
                type="number"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#1E293B" }}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#1E293B" }}
                width={95}
              />
              <Tooltip
                content={
                  <CustomChartTooltip
                    valueFormatter={(val) => `${val} vụ`}
                  />
                }
              />
              <Bar dataKey="count" name="Số ca" radius={[0, 4, 4, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Right Side: Key Indicators & Confidence Breakdown */}
        <div className="flex flex-col justify-between space-y-3 lg:col-span-5 border-t lg:border-t-0 lg:border-l border-slate-800/80 pt-4 lg:pt-0 lg:pl-5">
          {/* Autonomous vs Human Touch Metric */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Chuẩn tự động (≥ 0.75)
              </span>
              <span className="font-mono text-sm font-bold text-emerald-400">
                {metrics.confidenceTiers.high.percentage}%
              </span>
            </div>
            {/* Progress Bar */}
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${metrics.confidenceTiers.high.percentage}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] text-slate-500">
              <span>{metrics.confidenceTiers.high.count} vụ đạt chuẩn</span>
              <span>Tổng {metrics.totalDisputes} tranh chấp</span>
            </div>
          </div>

          {/* Admin Override Rate */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-slate-300">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                Tỷ lệ Admin Override
              </span>
              <span className="font-mono text-sm font-bold text-amber-400">
                {metrics.adminOverrideRatePct}%
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{ width: `${Math.min(metrics.adminOverrideRatePct, 100)}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] text-slate-500">
              <span>{metrics.adminOverrideCount} ca thay đổi phán quyết</span>
              <span>{metrics.resolutionRatePct}% giải quyết xong</span>
            </div>
          </div>

          {/* Confidence Tiers Breakdown */}
          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
            <div className="rounded border border-rose-950/40 bg-rose-950/20 p-1.5 text-rose-400">
              <div className="font-medium">&lt; 0.60</div>
              <div className="font-mono font-bold text-slate-200">
                {metrics.confidenceTiers.low.count} ca
              </div>
            </div>
            <div className="rounded border border-amber-950/40 bg-amber-950/20 p-1.5 text-amber-400">
              <div className="font-medium">0.60 - 0.74</div>
              <div className="font-mono font-bold text-slate-200">
                {metrics.confidenceTiers.medium.count} ca
              </div>
            </div>
            <div className="rounded border border-emerald-950/40 bg-emerald-950/20 p-1.5 text-emerald-400">
              <div className="font-medium">≥ 0.75</div>
              <div className="font-mono font-bold text-slate-200">
                {metrics.confidenceTiers.high.count} ca
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

