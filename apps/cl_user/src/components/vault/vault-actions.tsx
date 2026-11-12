"use client";

import * as React from "react";
import { CheckCircle2, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VaultActionsProps {
  onSettle: () => void;
  onDispute: () => void;
  isSettling: boolean;
  isSettled: boolean;
}

export function VaultActions({
  onSettle,
  onDispute,
  isSettling,
  isSettled,
}: VaultActionsProps) {
  return (
    <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 space-y-4 shadow-sm">
      <div className="text-center sm:text-left space-y-1">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
          XÁC NHẬN NHẬN HÀNG HOẶC BÁO LỖI
        </h3>
        <p className="text-xs text-slate-500">
          Bạn có toàn quyền kiểm tra sản phẩm trước khi chuyển tiền cho người bán.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        {/* Action 1: Settle & Release Funds */}
        <Button
          type="button"
          onClick={onSettle}
          disabled={isSettling || isSettled}
          className="min-h-[52px] text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center gap-2 border border-emerald-700 rounded-xl cursor-pointer"
        >
          <CheckCircle2 className="size-5" />
          <span>
            {isSettled
              ? "Đã Chuyển Tiền Cho Người Bán"
              : "Hàng Đúng Mô Tả - Nghiệm Thu & Giải Ngân"}
          </span>
        </Button>

        {/* Action 2: Dispute */}
        <Button
          type="button"
          variant="outline"
          onClick={onDispute}
          disabled={isSettled}
          className="min-h-[52px] text-sm font-bold border-2 border-rose-200 bg-white hover:bg-rose-50 text-rose-700 shadow-xs flex items-center justify-center gap-2 rounded-xl cursor-pointer"
        >
          <Scale className="size-5 text-rose-600" />
          <span>Báo Lỗi &amp; Khiếu Nại (Trợ Lý Phân Xử)</span>
        </Button>
      </div>
    </div>
  );
}
