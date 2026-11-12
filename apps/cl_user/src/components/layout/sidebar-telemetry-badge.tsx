"use client";

import * as React from "react";

export function SidebarTelemetryBadge() {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-2xs relative overflow-hidden group">
      <div className="flex items-center justify-between text-[10px] font-mono">
        <span className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-600" />
          </span>
          <span>BẢO CHỨNG VIETQR</span>
        </span>
        <span className="text-slate-400 font-mono text-[11px]">24/7</span>
      </div>
      <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
        <span className="text-slate-500 font-medium">Bảo vệ:</span>
        <span className="font-mono text-slate-800 font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-[10px]">
          Tự Động &amp; An Toàn
        </span>
      </div>
    </div>
  );
}
