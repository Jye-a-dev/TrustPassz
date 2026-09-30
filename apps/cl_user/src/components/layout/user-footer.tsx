"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldCheck, LifeBuoy, FileText, CheckCircle2, Lock, Terminal, ExternalLink } from "lucide-react";

export function UserFooter() {
  return (
    <footer className="border-t border-slate-800/80 bg-[#070A10]/95 text-slate-400 py-3.5 px-4 sm:px-6 mt-auto">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs max-w-7xl mx-auto">
        {/* Left: Smart contract status */}
        <div className="flex flex-wrap items-center gap-2 text-slate-400 font-mono text-[11px]">
          <div className="flex size-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="size-3" />
          </div>
          <span className="text-slate-400">HỆ THỐNG BẢO VỆ:</span>
          <Link
            href="https://sepolia.basescan.org/address/0x165B47291B87569b91696DCE6f1207eE15C9f783"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-cyan-400 hover:text-cyan-300 hover:underline bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800 inline-flex items-center gap-1 shadow-sm"
          >
            <span>0x165B...f783</span>
            <ExternalLink className="size-2.5 text-cyan-500" />
          </Link>
          <span className="text-slate-500">• Tự Động 24/7</span>
        </div>

        {/* Center: Enclave Status */}
        <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
          <Terminal className="size-3 text-cyan-400" />
          <span>HỆ THỐNG BẢO MẬT &amp; MÃ HÓA TỰ ĐỘNG</span>
        </div>

        {/* Right: Emergency support & Policy */}
        <div className="flex items-center gap-4 text-[11px] font-medium">
          <Link
            href="/user/disputes"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-amber-400 transition-colors"
          >
            <LifeBuoy className="size-3.5 text-amber-400" />
            <span>Trợ Lý Phân Xử 24/7</span>
          </Link>

          <span className="text-slate-800">•</span>

          <Link
            href="/deals/demo"
            className="inline-flex items-center gap-1 text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <FileText className="size-3.5 text-cyan-400" />
            <span>Quy Chế Giữ Tiền An Toàn</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
