"use client";

import * as React from "react";

export function SidebarTelemetryBadge() {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 shadow-sm backdrop-blur-xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 size-16 bg-emerald-500/5 rounded-full blur-md pointer-events-none" />
      <div className="flex items-center justify-between text-[10px] font-mono">
        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
          </span>
        </span>
        <span className="text-slate-400 font-mono text-[11px]">24/7</span>
      </div>
      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
        <span className="text-slate-400 font-medium">Bảo vệ:</span>
        <span className="font-mono text-cyan-400 font-semibold bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20 text-[10px]">
          Tự Động &amp; An Toàn
        </span>
      </div>
    </div>
  );
}
