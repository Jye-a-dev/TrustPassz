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
    <div className="space-y-4 pt-4 border-t border-slate-100">
      {/* Escrow Valuation & Inspection Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label
            htmlFor="deal-amount"
            className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono block"
          >
            3. GIÁ GIAO DỊCH BẢO CHỨNG (VNĐ) <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <Input
              id="deal-amount"
              type="number"
              min={1000}
              step={10000}
              placeholder="Nhập số tiền người mua cần trả"
              disabled={disabled}
              value={amount}
              onChange={(e) =>
                onAmountChange(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="bg-white border-slate-300 text-rose-600 placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 min-h-[44px] pr-14 font-mono text-base font-bold shadow-2xs"
              required
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400 font-bold">
              VNĐ
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {typeof amount === "number" && amount > 0
              ? `Số tiền quy đổi: ${amount.toLocaleString("vi-VN")} ₫`
              : "Mức tiền người mua sẽ quét nạp vào két giữ tiền an toàn."}
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono block">
              THỜI GIAN ĐỒNG KIỂM &amp; DÙNG THỬ <span className="text-rose-600">*</span>
            </label>
            {isPhysical && (
              <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-mono text-amber-700 font-bold">
                Khuyên dùng: 24h - 48h
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
                    "min-h-[44px] rounded-xl text-xs font-semibold transition-all cursor-pointer flex flex-col items-center justify-center p-1.5 shadow-2xs",
                    isSelected
                      ? "border-2 border-rose-500 bg-rose-50 text-rose-700 font-bold"
                      : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <span className="font-bold">{option.label}</span>
                  <span className="text-[9px] opacity-75 font-normal">{option.hint}</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-500">
            Thời gian người mua kiểm tra sản phẩm trước khi tiền tự động giải ngân.
          </p>
        </div>
      </div>

      {/* Designated Buyer ID (Optional) */}
      <div className="space-y-1.5 pt-2">
        <label htmlFor="buyer-id" className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono block">
          CHỈ ĐỊNH NGƯỜI MUA (TÙY CHỌN)
        </label>
        <Input
          id="buyer-id"
          disabled={disabled}
          placeholder="Nhập ID người mua nếu giao dịch riêng, hoặc để trống để đăng công khai lên sàn"
          value={buyerId}
          onChange={(e) => onBuyerIdChange(e.target.value)}
          className="bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 min-h-[44px] text-xs font-mono shadow-2xs"
        />
      </div>
    </div>
  );
}
