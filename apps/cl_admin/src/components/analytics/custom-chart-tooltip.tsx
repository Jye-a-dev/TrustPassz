"use client";

import * as React from "react";

export interface TooltipItem {
  name: string;
  value: number | string;
  color?: string;
  unit?: string;
}

export interface CustomChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number | string;
    color?: string;
    fill?: string;
    stroke?: string;
    dataKey?: string | number;
  }>;
  label?: string;
  titlePrefix?: string;
  valueFormatter?: (value: number, name?: string) => string;
}

export function formatVndCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(2)} tỷ ₫`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)} tr ₫`;
  }
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatEthCurrency(amount: number): string {
  return `${Number(amount).toFixed(4)} ETH`;
}

export function CustomChartTooltip({
  active,
  payload,
  label,
  titlePrefix,
  valueFormatter,
}: CustomChartTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="z-50 min-w-50 rounded-lg border border-slate-800 bg-cyber-surface/95 p-3 shadow-2xl backdrop-blur-md">
      {label && (
        <div className="mb-2 border-b border-slate-800/80 pb-1.5 text-xs font-medium text-slate-400">
          {titlePrefix ? `${titlePrefix} ` : ""}
          <span className="text-slate-200">{label}</span>
        </div>
      )}
      <div className="space-y-1.5">
        {payload.map((item, index) => {
          const itemColor = item.color || item.stroke || item.fill || "#06B6D4";
          const rawValue = typeof item.value === "number" ? item.value : Number(item.value) || 0;
          const displayValue = valueFormatter
            ? valueFormatter(rawValue, item.name)
            : rawValue.toLocaleString("vi-VN");

          return (
            <div
              key={`${item.name || index}-${index}`}
              className="flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2 truncate text-slate-300">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: itemColor }}
                />
                <span className="truncate">{item.name || "Giá trị"}</span>
              </div>
              <span className="font-mono font-semibold tabular-nums text-slate-100">
                {displayValue}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

