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
    <div className="flex flex-col items-center justify-center p-5 sm:p-6 bg-slate-50 rounded-2xl border border-slate-200/80 shadow-xs relative group shrink-0">
      {/* VietQR Image Container */}
      <div className="relative p-3 bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden max-w-60 w-full">
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
          <div className="absolute inset-0 bg-emerald-500/95 flex flex-col items-center justify-center text-white font-black p-4 text-center animate-in fade-in zoom-in duration-300">
            <Check className="size-12 stroke-3 mb-2" />
            <span className="text-sm">ĐÃ NHẬN TIỀN CỌC!</span>
            <span className="text-xs font-medium text-emerald-100">Đang mở Két bảo chứng...</span>
          </div>
        )}
      </div>

      <div className="text-[10px] font-mono font-bold text-slate-500 mt-3 tracking-wider">
        VIETQR.IO • MBBANK PAYOS
      </div>

      {/* Quick Live Status */}
      <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-rose-600">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-rose-500" />
        </span>
        <span>Đang chờ giao dịch từ ngân hàng...</span>
      </div>

      <p className="text-[11px] text-slate-500 text-center mt-1">
        Tự động kích hoạt ngay khi tiền vào két bảo chứng
      </p>
    </div>
  );
}
