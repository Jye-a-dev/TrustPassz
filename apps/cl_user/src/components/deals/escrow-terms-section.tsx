"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

export interface EscrowTermsSectionProps {
  amount: number | "";
  onAmountChange: (value: number | "") => void;
  inspectionDuration: number;
  onInspectionDurationChange: (duration: number) => void;
  buyerId: string;
  onBuyerIdChange: (buyerId: string) => void;
  disabled?: boolean;
}

const INSPECTION_OPTIONS = [
  { label: "6 Giờ", value: 21600 },
  { label: "12 Giờ", value: 43200 },
  { label: "24 Giờ", value: 86400 },
];

export function EscrowTermsSection({
  amount,
  onAmountChange,
  inspectionDuration,
  onInspectionDurationChange,
  buyerId,
  onBuyerIdChange,
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
              className="bg-slate-950/80 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 min-h-11 pr-12"
              required
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
              VNĐ
            </span>
          </div>
          {typeof amount === "number" && amount > 0 && (
            <p className="text-[11px] text-cyan-400">
              Quy đổi: {amount.toLocaleString("vi-VN")} ₫
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-200">
            Thời hạn kiểm thử bàn giao (Buyer Inspection)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {INSPECTION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={disabled}
                onClick={() => onInspectionDurationChange(option.value)}
                className={`min-h-11 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                  inspectionDuration === option.value
                    ? "border-cyan-500 bg-cyan-950/40 text-cyan-300 ring-1 ring-cyan-500/50"
                    : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-slate-400 block">
            Thời gian bảo vệ buyer kiểm thử trước khi quỹ ký quỹ tự động giải phóng.
          </span>
        </div>
      </div>

      {/* Designated Buyer ID (Optional) */}
      <div className="space-y-1.5">
        <label htmlFor="buyer-id" className="text-xs font-medium text-slate-300">
          Chỉ định Buyer UUID (Tùy chọn)
        </label>
        <Input
          id="buyer-id"
          placeholder="Để trống nếu muốn tạo link công khai cho bất kỳ ai tham gia"
          disabled={disabled}
          value={buyerId}
          onChange={(e) => onBuyerIdChange(e.target.value)}
          className="bg-slate-950/80 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 min-h-11 text-xs"
        />
      </div>
    </div>
  );
}
