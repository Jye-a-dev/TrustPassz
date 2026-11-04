"use client";

import * as React from "react";
import { Zap } from "lucide-react";

export interface PresetOption {
  id: "preset-5" | "preset-10" | "preset-floor";
  label: string;
  discountLabel: string;
  price: number;
}

export interface QuickBidPresetsProps {
  basePrice: number;
  floorPrice: number;
  currentPrice: number;
  onSelectPreset: (price: number) => void;
  disabled?: boolean;
  isCoolingDown?: boolean;
}

/**
 * Pure calculation function for quick-bid presets.
 * Enforces strict mathematical bounds [floorPrice, basePrice]
 * and rounds amounts to the nearest 1,000 VND.
 */
export function computeQuickBidPresets(
  basePrice: number,
  floorPrice: number
): PresetOption[] {
  const effectiveBase = Math.max(0, basePrice);
  const effectiveFloor = Math.max(0, Math.min(effectiveBase, floorPrice));

  const raw5 = Math.round((effectiveBase * 0.95) / 1000) * 1000;
  const price5 = Math.max(effectiveFloor, Math.min(effectiveBase, raw5));

  const raw10 = Math.round((effectiveBase * 0.9) / 1000) * 1000;
  const price10 = Math.max(effectiveFloor, Math.min(effectiveBase, raw10));

  const rawFloor = Math.round(effectiveFloor / 1000) * 1000;
  const priceFloor = Math.max(effectiveFloor, Math.min(effectiveBase, rawFloor));

  return [
    {
      id: "preset-5",
      label: "-5%",
      discountLabel: "Giảm 5%",
      price: price5,
    },
    {
      id: "preset-10",
      label: "-10%",
      discountLabel: "Giảm 10%",
      price: price10,
    },
    {
      id: "preset-floor",
      label: "Giá sàn (Tối thiểu)",
      discountLabel: "Giá sàn chấp nhận",
      price: priceFloor,
    },
  ];
}

/**
 * Quick-bid presets pill component for Bargain Slider.
 * Adheres to Cyber-Dark theme, touch targets >= 44px, and mobile responsiveness.
 */
export function QuickBidPresets({
  basePrice,
  floorPrice,
  currentPrice,
  onSelectPreset,
  disabled = false,
  isCoolingDown = false,
}: QuickBidPresetsProps) {
  const presets = React.useMemo(
    () => computeQuickBidPresets(basePrice, floorPrice),
    [basePrice, floorPrice]
  );

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-xs tracking-tight">Đề xuất nhanh</span>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">
          Mức giá gợi ý tự động
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => {
          const isSelected = currentPrice === preset.price;

          return (
            <button
              key={preset.id}
              type="button"
              disabled={disabled || isCoolingDown}
              onClick={() => onSelectPreset(preset.price)}
              style={{ touchAction: "manipulation" }}
              aria-pressed={isSelected}
              className={`flex-1 min-w-26.25 min-h-11 px-3 py-2 rounded-lg border text-xs flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 transition-all select-none cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                isSelected
                  ? "border-emerald-500 text-emerald-400 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.25)] font-bold ring-1 ring-emerald-500/30"
                  : "border-slate-800 bg-slate-950/60 hover:border-cyan-500/50 hover:bg-cyan-500/10 text-slate-300"
              }`}
            >
              <span className="font-bold tracking-tight text-xs">
                {preset.label}
              </span>
              <span
                className={`font-mono text-[11px] tracking-tight ${
                  isSelected ? "text-emerald-300" : "text-slate-400"
                }`}
              >
                {preset.price.toLocaleString("vi-VN")} ₫
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

