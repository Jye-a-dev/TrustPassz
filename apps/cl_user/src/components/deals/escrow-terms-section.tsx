"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EscrowTermsSectionProps {
  amount: number | "";
  onAmountChange: (value: number | "") => void;
  inspectionDuration: number;
  onInspectionDurationChange: (duration: number) => void;
  buyerId: string;
  onBuyerIdChange: (buyerId: string) => void;
  isPhysical?: boolean;
  disabled?: boolean;
}

const INSPECTION_OPTIONS = [
  { label: "6 Giờ", value: 21600, hint: "Kiểm tra nhanh" },
  { label: "12 Giờ", value: 43200, hint: "Tiêu chuẩn" },
  { label: "24 Giờ", value: 86400, hint: "Khuyên dùng" },
  { label: "48 Giờ", value: 172800, hint: "Hàng vật lý" },
];

export function EscrowTermsSection({
  amount,
  onAmountChange,
  inspectionDuration,
  onInspectionDurationChange,
  buyerId,
  onBuyerIdChange,
  isPhysical = false,
  disabled = false,
}: EscrowTermsSectionProps) {
  return (
    <div className="space-y-4">
      {/* Escrow Valuation & Inspection Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label
            htmlFor="deal-amount"
            className="text-sm font-semibold text-slate-200"
          >
            Giá trị ký quỹ niêm yết (VNĐ) <span className="text-cyan-400">*</span>
          </label>
          <div className="relative">
            <Input
              id="deal-amount"
              type="number"
              min={1000}
              step={10000}
              placeholder="500000"
              disabled={disabled}
              value={amount}
              onChange={(e) =>
                onAmountChange(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="bg-slate-950/80 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 min-h-11 pr-12 font-mono text-sm"
              required
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
              VNĐ
            </span>
          </div>
          {typeof amount === "number" && amount > 0 && (
            <p className="text-[11px] text-cyan-400 font-mono">
              Quy đổi: {amount.toLocaleString("vi-VN")} ₫
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
              <Clock className="size-4 text-cyan-400" />
              <span>Thời hạn kiểm thử bàn giao</span>
            </label>
            {isPhysical && (
              <span className="rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono text-amber-300">
                Khuyên dùng 24h - 48h
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {INSPECTION_OPTIONS.map((option) => {
              const isSelected = inspectionDuration === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => onInspectionDurationChange(option.value)}
                  className={cn(
                    "min-h-11 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex flex-col items-center justify-center p-1.5",
                    isSelected
                      ? isPhysical
                        ? "border-amber-500 bg-amber-950/40 text-amber-300 ring-1 ring-amber-500/50"
                        : "border-cyan-500 bg-cyan-950/40 text-cyan-300 ring-1 ring-cyan-500/50"
                      : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700"
                  )}
                >
                  <span className="font-bold">{option.label}</span>
                  <span className="text-[9px] opacity-70 font-normal">{option.hint}</span>
                </button>
              );
            })}
          </div>
          <span className="text-[11px] text-slate-400 block leading-tight">
            Thời gian bảo vệ buyer kiểm thử trước khi quỹ ký quỹ tự động giải phóng.
          </span>
        </div>
      </div>

      {/* Designated Buyer ID (Optional) */}
      <div className="space-y-1.5">
        <label htmlFor="buyer-id" className="text-xs font-medium text-slate-300">
          Chỉ định Buyer UUID (Tùy chọn - nếu để trống kèo sẽ hiển thị công khai trên Explore)
        </label>
        <Input
          id="buyer-id"
          disabled={disabled}
          placeholder="Ví dụ: 2d5ca332-d489-43ba-b8ed-74f0f54e670c (để trống nếu bán công khai)"
          value={buyerId}
          onChange={(e) => onBuyerIdChange(e.target.value)}
          className="bg-slate-950/80 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 min-h-11 text-xs font-mono"
        />
      </div>
    </div>
  );
}
