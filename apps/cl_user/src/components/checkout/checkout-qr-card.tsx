"use client";

import * as React from "react";
import Image from "next/image";
import { Check } from "lucide-react";

interface CheckoutQrCardProps {
  vietQrUrl: string;
  isSuccessGlow: boolean;
}

export function CheckoutQrCard({ vietQrUrl, isSuccessGlow }: CheckoutQrCardProps) {
  return (
    <div className="md:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-950/90 border border-slate-800/90 relative group">
      {/* VietQR Image Container with high contrast border */}
      <div className="relative p-3 bg-white rounded-xl shadow-xl overflow-hidden max-w-60 w-full">
        <Image
          src={vietQrUrl}
          alt="Dynamic VietQR TrustPassz"
          width={240}
          height={240}
          unoptimized
          priority
          className="w-full h-auto object-contain rounded-lg"
        />

        {/* Success Overlay on real-time confirmed */}
        {isSuccessGlow && (
          <div className="absolute inset-0 bg-emerald-500/90 flex flex-col items-center justify-center text-slate-950 font-black p-4 text-center animate-in fade-in zoom-in duration-300">
            <Check className="size-12 stroke-3 mb-2" />
            <span className="text-sm">ĐÃ NHẬN TIỀN CỌC!</span>
            <span className="text-xs font-medium">Đang mở két số...</span>
          </div>
        )}
      </div>

      {/* Quick Live Status */}
      <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-cyan-400">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-cyan-500" />
        </span>
        <span>Đang chờ giao dịch từ ngân hàng...</span>
      </div>

      <p className="text-[11px] text-slate-400 text-center mt-1">
        Tự động kích hoạt ngay khi tiền vào tài khoản
      </p>
    </div>
  );
}
