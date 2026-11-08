"use client";

import * as React from "react";
import { AlertTriangle, ExternalLink } from "lucide-react";

export function PreReleaseBanner() {
  const [visible, setVisible] = React.useState(true);
  const isPreRelease =
    process.env.NEXT_PUBLIC_ENVIRONMENT === "pre-release" ||
    process.env.NEXT_PUBLIC_ENVIRONMENT === "testnet" ||
    process.env.NEXT_PUBLIC_ENVIRONMENT === "staging" ||
    process.env.NODE_ENV !== "production";

  if (!isPreRelease || !visible) return null;

  return (
    <div
      role="banner"
      className="relative z-50 w-full bg-amber-50 border-b border-amber-200 px-3 sm:px-6 py-2 text-xs text-amber-900 transition-colors"
    >
      <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 font-bold text-amber-800 shrink-0">
            <AlertTriangle className="size-3.5 text-amber-600" />
            Chế Độ Sandbox
          </span>
          <span className="text-amber-800 truncate">
            Môi trường bảo chứng mua bán tự động. Giữ tiền an toàn qua mã VietQR Napas 24/7.
          </span>
        </div>
        <div className="flex items-center gap-4 shrink-0 text-[11px] sm:text-xs">
          <a
            href="https://sepolia.basescan.org/address/0x165B47291B87569b91696DCE6f1207eE15C9f783"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-rose-600 hover:text-rose-700 underline decoration-rose-300 inline-flex items-center gap-1"
          >
            <span>Quy chế bảo vệ (Base Sepolia)</span>
            <ExternalLink className="size-3" />
          </a>
          <span className="text-amber-300">|</span>
          <button
            type="button"
            onClick={() => setVisible(false)}
            aria-label="Đóng banner"
            className="font-medium text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            Đóng ✕
          </button>
        </div>
      </div>
    </div>
  );
}

