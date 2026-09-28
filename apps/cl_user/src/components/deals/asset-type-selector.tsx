"use client";

import * as React from "react";
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
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-200">
        Loại tài sản số bàn giao <span className="text-cyan-400">*</span>
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {ASSET_TYPE_OPTIONS.map((item) => {
          const Icon = item.icon;
          const isSelected = value === item.value;
          return (
            <button
              key={item.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(item.value)}
              className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all min-h-18 cursor-pointer ${
                isSelected
                  ? "border-cyan-500 bg-cyan-950/30 ring-1 ring-cyan-500/50 text-white"
                  : "border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-400"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon
                  className={`w-4 h-4 ${
                    isSelected ? "text-cyan-400" : "text-slate-400"
                  }`}
                />
                <span className="text-xs font-semibold">{item.label}</span>
              </div>
              <span className="text-[11px] text-slate-400 leading-snug line-clamp-1">
                {item.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
