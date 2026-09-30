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
    <div className="rounded-2xl border border-slate-800 bg-[#0F172A] p-6 space-y-4 shadow-xl">
      <div className="text-center sm:text-left space-y-1">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Xác Nhận Nhận Hàng Hoặc Báo Lỗi
        </h3>
        <p className="text-xs text-slate-400">
          Bạn có quyền toàn quyền kiểm tra sản phẩm trước khi chuyển tiền cho người bán.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        {/* Action 1: Settle & Release Funds */}
        <Button
          type="button"
          onClick={onSettle}
          disabled={isSettling || isSettled}
          className="min-h-13 text-sm font-extrabold bg-linear-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckCircle2 className="size-5" />
          <span>
            {isSettled
              ? "Đã Chuyển Tiền Cho Người Bán"
              : "Hàng Đúng Mô Tả - Chuyển Tiền Cho Người Bán"}
          </span>
        </Button>

        {/* Action 2: Dispute */}
        <Button
          type="button"
          variant="outline"
          onClick={onDispute}
          disabled={isSettled}
          className="min-h-13 text-sm font-extrabold border-rose-500/50 bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 hover:text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer"
        >
          <Scale className="size-5 text-rose-400" />
          <span>Báo Lỗi &amp; Khiếu Nại (Trợ Lý Phân Xử)</span>
        </Button>
      </div>
    </div>
  );
}
