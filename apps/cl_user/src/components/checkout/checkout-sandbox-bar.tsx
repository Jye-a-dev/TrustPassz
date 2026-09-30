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
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex items-start gap-3 text-xs text-slate-400">
        <Lock className="size-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-300 block">
            Tiền được giữ an toàn 100% trong Két bảo vệ
          </span>
          <p className="leading-relaxed">
            Ngay khi hệ thống nhận được chuyển khoản với đúng nội dung{" "}
            <strong className="text-amber-300 font-mono">{memo}</strong>, giao dịch
            sẽ được kích hoạt bảo vệ an toàn và mở khóa Kho lưu trữ bảo mật để bạn kiểm tra sản phẩm.
          </p>
        </div>
      </div>

      {/* Developer Sandbox Simulation Bar */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
          <Zap className="size-3.5 text-cyan-400" />
          Chế độ thử nghiệm thanh toán (Dành cho kiểm thử):
        </span>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onSimulateWebhook}
          className="min-h-10 border-cyan-500/40 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/50 text-xs font-semibold gap-1.5 cursor-pointer"
        >
          <Sparkles className="size-3.5" />
          Mô phỏng Quét mã thành công (Thử nghiệm)
        </Button>
      </div>
    </>
  );
}
