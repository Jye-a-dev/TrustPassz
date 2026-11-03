"use client";

import * as React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useMounted } from "@/hooks/use-mounted";
import { TvlDataPoint, TvlTimeframe } from "@/types/analytics";
import {
  CustomChartTooltip,
  formatVndCurrency,
  formatEthCurrency,
} from "./custom-chart-tooltip";

interface TvlAreaChartProps {
  data: TvlDataPoint[];
  timeframe: TvlTimeframe;
  onTimeframeChange: (tf: TvlTimeframe) => void;
  isLoading?: boolean;
}

export function TvlAreaChart({
  data,
  timeframe,
  onTimeframeChange,
  isLoading = false,
}: TvlAreaChartProps) {
  const isMounted = useMounted();
  const [metricMode, setMetricMode] = React.useState<"LOCKED" | "VOLUME">("LOCKED");
  const [currencyMode, setCurrencyMode] = React.useState<"VND" | "ETH">("VND");

  if (!isMounted || isLoading) {
    return (
      <div className="flex h-95 w-full flex-col justify-between rounded-xl border border-slate-800/80 bg-cyber-surface/90 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="h-5 w-48 animate-pulse rounded bg-slate-800" />
          <div className="h-8 w-36 animate-pulse rounded bg-slate-800" />
        </div>
        <div className="h-70 w-full animate-pulse rounded-lg bg-slate-900/50" />
      </div>
    );
  }

  const isVnd = currencyMode === "VND";
  const dataKey =
    currencyMode === "VND"
      ? metricMode === "LOCKED"
        ? "vndLocked"
        : "vndVolume"
      : metricMode === "LOCKED"
        ? "ethLocked"
        : "ethVolume";

  const seriesName =
    currencyMode === "VND"
      ? metricMode === "LOCKED"
        ? "TVL Ký quỹ VNĐ"
        : "Volume Luân chuyển VNĐ"
      : metricMode === "LOCKED"
        ? "TVL Ký quỹ ETH"
        : "Volume Luân chuyển ETH";

  const gradientId = isVnd ? "tvlCyanGradient" : "tvlEmeraldGradient";
  const strokeColor = isVnd ? "#06B6D4" : "#10B981";

  const formatYAxis = (val: number) => {
    if (val === 0) return "0";
    if (isVnd) {
      if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
      if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)}M`;
      if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
      return String(val);
    }
    return val >= 1 ? `${val.toFixed(2)} Ξ` : `${val.toFixed(3)} Ξ`;
  };

  const formatDateAxis = (tickStr: string) => {
    if (!tickStr) return "";
    const parts = tickStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return tickStr;
  };

  return (
    <div className="flex w-full flex-col rounded-xl border border-slate-800/80 bg-cyber-surface/90 p-5 shadow-xl backdrop-blur-md">
      {/* Chart Header & Controls */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-100">
              Biến động TVL & Escrow Volume
            </h3>
            <span className="rounded bg-cyan-950/60 px-2 py-0.5 text-[10px] font-medium text-cyan-400 border border-cyan-800/50">
              Realtime Aggregated
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Dòng tiền ký quỹ đang khóa và luân chuyển qua Smart Contract & VietQR
          </p>
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Currency Switcher */}
          <div className="flex rounded-lg border border-slate-800 bg-slate-900/60 p-1">
            <button
              type="button"
              onClick={() => setCurrencyMode("VND")}
              className={`min-h-11 min-w-11 rounded-md px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center touch-manipulation ${
                currencyMode === "VND"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              VNĐ (Fiat)
            </button>
            <button
              type="button"
              onClick={() => setCurrencyMode("ETH")}
              className={`min-h-11 min-w-11 rounded-md px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center touch-manipulation ${
                currencyMode === "ETH"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              ETH (Base)
            </button>
          </div>

          {/* Metric Toggle */}
          <div className="flex rounded-lg border border-slate-800 bg-slate-900/60 p-1">
            <button
              type="button"
              onClick={() => setMetricMode("LOCKED")}
              className={`min-h-11 min-w-11 rounded-md px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center touch-manipulation ${
                metricMode === "LOCKED"
                  ? "bg-slate-700/80 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Đang khóa
            </button>
            <button
              type="button"
              onClick={() => setMetricMode("VOLUME")}
              className={`min-h-11 min-w-11 rounded-md px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center touch-manipulation ${
                metricMode === "VOLUME"
                  ? "bg-slate-700/80 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Lũy kế
            </button>
          </div>

          {/* Timeframe Selector */}
          <div className="flex rounded-lg border border-slate-800 bg-slate-900/60 p-1">
            {(["7d", "30d", "90d"] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => onTimeframeChange(tf)}
                className={`min-h-11 min-w-11 rounded-md px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center touch-manipulation ${
                  timeframe === tf
                    ? "bg-slate-800 text-cyan-400 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recharts Area Container */}
      <div className="h-75 w-full">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-500">
            Chưa có giao dịch ký quỹ trong khung thời gian đã chọn
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="tvlCyanGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="tvlEmeraldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1E293B"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatDateAxis}
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#1E293B" }}
                dy={8}
              />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#1E293B" }}
                tickFormatter={formatYAxis}
                dx={-4}
              />
              <Tooltip
                content={
                  <CustomChartTooltip
                    titlePrefix="Ngày"
                    valueFormatter={(val) =>
                      isVnd ? formatVndCurrency(val) : formatEthCurrency(val)
                    }
                  />
                }
              />
              <Area
                type="monotone"
                dataKey={dataKey}
                name={seriesName}
                stroke={strokeColor}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
                activeDot={{
                  r: 5,
                  stroke: "#080C14",
                  strokeWidth: 2,
                  fill: strokeColor,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

