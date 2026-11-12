"use client";

import * as React from "react";
import { Lock, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CheckoutSandboxBarProps {
  memo: string;
  onSimulateWebhook: () => void;
}

export function CheckoutSandboxBar({
  memo,
  onSimulateWebhook,
}: CheckoutSandboxBarProps) {
  return (
    <>
      {/* Security & Instruction Footer Notice */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-start gap-3 text-xs text-slate-600">
        <Lock className="size-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-800 block">
            Tiền được giữ an toàn 100% trong Két bảo chứng
          </span>
          <p className="leading-relaxed">
            Ngay khi hệ thống nhận được chuyển khoản với đúng nội dung{" "}
            <strong className="text-rose-600 font-mono font-bold">{memo}</strong>, giao dịch
            sẽ được kích hoạt bảo vệ an toàn và mở khóa Kho lưu trữ bảo mật để bạn kiểm tra sản phẩm.
          </p>
        </div>
      </div>

      {/* Developer Sandbox Simulation Bar */}
      <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="text-slate-500 text-[11px] flex items-center gap-1.5">
          <Zap className="size-3.5 text-amber-500" />
          Chế độ thử nghiệm thanh toán (Dành cho kiểm thử):
        </span>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onSimulateWebhook}
          className="min-h-11 border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold gap-1.5 rounded-xl cursor-pointer shadow-xs"
        >
          <Sparkles className="size-3.5 text-rose-500" />
          Mô phỏng Quét mã thành công (Thử nghiệm)
        </Button>
      </div>
    </>
  );
}
