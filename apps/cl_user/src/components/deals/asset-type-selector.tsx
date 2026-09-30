"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ASSET_TYPE_OPTIONS,
  type AssetCategory,
} from "./create-deal.types";

export interface AssetTypeSelectorProps {
  value: AssetCategory;
  onChange: (value: AssetCategory) => void;
  disabled?: boolean;
}

export function AssetTypeSelector({
  value,
  onChange,
  disabled = false,
}: AssetTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-200">
          Loại sản phẩm bàn giao <span className="text-cyan-400">*</span>
        </label>
        <span className="text-xs font-mono text-slate-400">
          Tiêu Chuẩn Giao Dịch An Toàn
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {ASSET_TYPE_OPTIONS.map((item) => {
          const Icon = item.icon;
          const isSelected = value === item.value;
          const isPhysical = item.value === "PHYSICAL_ITEM";

          return (
            <button
              key={item.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(item.value)}
              className={cn(
                "group relative flex flex-col justify-between p-4 rounded-xl border text-left transition-all cursor-pointer overflow-hidden min-h-35",
                isSelected
                  ? isPhysical
                    ? "border-amber-500/80 bg-linear-to-b from-amber-950/40 via-[#0B0F17] to-amber-950/20 ring-1 ring-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                    : "border-cyan-500/80 bg-linear-to-b from-cyan-950/40 via-[#0B0F17] to-emerald-950/20 ring-1 ring-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.18)]"
                  : isPhysical
                  ? "border-slate-800/90 bg-[#0B0F17]/90 hover:border-amber-500/40 hover:bg-slate-900/60"
                  : "border-slate-800/90 bg-[#0B0F17]/90 hover:border-slate-700 hover:bg-slate-900/60"
              )}
            >
              {/* Subtle Ambient Glow */}
              {isSelected && (
                <div
                  className={cn(
                    "absolute -right-8 -top-8 size-24 rounded-full blur-2xl pointer-events-none",
                    isPhysical ? "bg-amber-500/15" : "bg-cyan-500/15"
                  )}
                />
              )}

              {/* Top Row: Icon + Title + Status Check */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "p-2 rounded-lg border transition-colors",
                        isSelected
                          ? isPhysical
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                            : "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                          : isPhysical
                          ? "bg-slate-900 text-amber-400/80 border-slate-800 group-hover:border-amber-500/30"
                          : "bg-slate-900 text-slate-400 border-slate-800 group-hover:text-slate-300"
                      )}
                    >
                      <Icon className="size-4.5" />
                    </div>

                    <span
                      className={cn(
                        "text-xs font-bold tracking-tight block",
                        isSelected
                          ? isPhysical
                            ? "text-amber-200"
                            : "text-white"
                          : "text-slate-200 group-hover:text-white"
                      )}
                    >
                      {item.label}
                    </span>
                  </div>

                  {/* Active indicator dot or badge */}
                  {isSelected ? (
                    <div
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-bold",
                        isPhysical
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      )}
                    >
                      <CheckCircle2 className="size-3" />
                      <span>Chọn</span>
                    </div>
                  ) : item.badgeText ? (
                    <span className="rounded-md bg-slate-900 px-1.5 py-0.5 text-[9px] font-mono font-medium text-slate-400 border border-slate-800">
                      {item.badgeText}
                    </span>
                  ) : null}
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                  {item.description}
                </p>
              </div>

              {/* Bottom: Delivery Method Pill */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400">Phương thức giao:</span>
                <span
                  className={cn(
                    "font-semibold truncate max-w-42.5",
                    isSelected
                      ? isPhysical
                        ? "text-amber-300"
                        : "text-cyan-300"
                      : "text-slate-400 group-hover:text-slate-300"
                  )}
                >
                  {item.deliveryMethod}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
