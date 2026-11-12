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
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono block">
          1. CHỌN LOẠI SẢN PHẨM / TÀI SẢN BÀN GIAO <span className="text-rose-600">*</span>
        </label>
        <p className="text-xs text-slate-500 mt-0.5">
          Chọn danh mục chuẩn sàn để áp dụng cơ chế bàn giao và đồng kiểm phù hợp.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {ASSET_TYPE_OPTIONS.map((item) => {
          const Icon = item.icon;
          const isSelected = value === item.value;

          return (
            <button
              key={item.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(item.value)}
              className={cn(
                "group relative flex flex-col justify-between p-4 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer overflow-hidden min-h-[140px]",
                isSelected
                  ? "border-2 border-rose-500 bg-rose-50/40 shadow-xs ring-0"
                  : "border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs"
              )}
            >
              {/* Top Row: Icon + Title + Status Check */}
              <div className="space-y-2 w-full">
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={cn(
                      "p-2 rounded-xl transition-colors",
                      isSelected
                        ? "bg-rose-100 text-rose-600 border border-rose-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    )}
                  >
                    <Icon className="size-4.5" />
                  </div>

                  {/* Active indicator dot or badge */}
                  {isSelected ? (
                    <div className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-bold bg-rose-100 text-rose-700 border border-rose-300">
                      <CheckCircle2 className="size-3" />
                      <span>Đã chọn</span>
                    </div>
                  ) : item.badgeText ? (
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-mono font-medium text-slate-500 border border-slate-200">
                      {item.badgeText}
                    </span>
                  ) : null}
                </div>

                <div>
                  <h4
                    className={cn(
                      "text-xs font-bold tracking-tight block mt-1",
                      isSelected ? "text-slate-900" : "text-slate-800"
                    )}
                  >
                    {item.label}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 mt-0.5">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Bottom: Delivery Method Pill */}
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono w-full">
                <span className="text-slate-400">Bàn giao:</span>
                <span
                  className={cn(
                    "font-semibold truncate max-w-[130px]",
                    isSelected ? "text-rose-600" : "text-slate-600"
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
