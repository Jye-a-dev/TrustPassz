"use client";

import * as React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useMounted } from "@/hooks/use-mounted";
import { DealDistributionItem } from "@/types/analytics";
import { formatVndCurrency } from "./custom-chart-tooltip";

interface DealDistributionChartProps {
  data: DealDistributionItem[];
  isLoading?: boolean;
}

interface CustomPieTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: DealDistributionItem;
  }>;
}

function CustomPieTooltip({ active, payload }: CustomPieTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const item = payload[0].payload;

  return (
    <div className="z-50 min-w-47.5 rounded-lg border border-slate-800 bg-cyber-surface/95 p-3 shadow-2xl backdrop-blur-md">
      <div className="mb-1.5 flex items-center gap-2 border-b border-slate-800/80 pb-1.5 text-xs font-semibold text-slate-200">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: item.color }}
        />
        <span>{item.label}</span>
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between text-slate-400">
          <span>Số lượng:</span>
          <span className="font-mono font-medium text-slate-100">
            {item.count.toLocaleString("vi-VN")} deal ({item.percentage}%)
          </span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Tổng giá trị:</span>
          <span className="font-mono font-medium text-cyan-400">
            {formatVndCurrency(item.totalAmountVnd)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function DealDistributionChart({
  data,
  isLoading = false,
}: DealDistributionChartProps) {
  const isMounted = useMounted();
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const totalDeals = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.count, 0);
  }, [data]);

  if (!isMounted || isLoading) {
    return (
      <div className="flex h-95 w-full flex-col justify-between rounded-xl border border-slate-800/80 bg-cyber-surface/90 p-5 backdrop-blur-md">
        <div className="h-5 w-44 animate-pulse rounded bg-slate-800" />
        <div className="flex h-70 w-full items-center justify-center">
          <div className="h-44 w-44 animate-pulse rounded-full border-4 border-slate-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col rounded-xl border border-slate-800/80 bg-cyber-surface/90 p-5 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-100">
            Phân bổ trạng thái Kèo
          </h3>
          <span className="rounded bg-slate-800/80 px-2 py-0.5 text-xs font-mono font-medium text-slate-300">
            Tổng: {totalDeals.toLocaleString("vi-VN")} deals
          </span>
        </div>
        <p className="mt-0.5 text-xs text-slate-400">
          Tỷ lệ và cơ cấu 6 trạng thái trong vòng đời Escrow
        </p>
      </div>

      {/* Main Content: Donut + Legend */}
      <div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-12">
        {/* Donut Chart with Centered KPI */}
        <div className="relative h-60 w-full lg:col-span-6 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomPieTooltip />} />
              <Pie
                data={data}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={3}
                stroke="#080C14"
                strokeWidth={2}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.state}`}
                    fill={entry.color}
                    opacity={
                      activeIndex === null || activeIndex === index ? 1 : 0.4
                    }
                    className="transition-opacity duration-200 cursor-pointer"
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center Hole Content */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Tổng Kèo
            </span>
            <span className="font-mono text-2xl font-bold text-slate-100">
              {totalDeals.toLocaleString("vi-VN")}
            </span>
          </div>
        </div>

        {/* Detailed Legend List */}
        <div className="flex flex-col justify-center space-y-2 lg:col-span-6">
          {data.map((item, index) => {
            const isHovered = activeIndex === index;
            return (
              <div
                key={item.state}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`flex min-h-11 items-center justify-between rounded-lg px-3 py-2 transition-colors cursor-pointer text-xs touch-manipulation ${
                  isHovered
                    ? "bg-slate-800/80 border border-slate-700/60"
                    : "hover:bg-slate-900/60"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate text-slate-300 font-medium">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-slate-400">{item.count}</span>
                  <span
                    className="w-12 text-right font-semibold"
                    style={{ color: item.color }}
                  >
                    {item.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

