import { ShieldCheck } from "lucide-react";

export default function RootLoading() {
  return (
    <div className="relative flex min-h-[80vh] w-full flex-col items-center justify-center p-6 text-center bg-[#0B0F17] text-slate-100 overflow-hidden select-none">
      {/* Background Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-80 sm:size-96 rounded-full bg-gradient-to-tr from-cyan-500/10 via-emerald-500/10 to-transparent blur-[120px] pointer-events-none" />

      {/* Pulse Radar & Shield Spin Centerpiece (Zero Layout Shift) */}
      <div className="relative flex size-40 sm:size-48 items-center justify-center">
        {/* Radar Ring 1 - Outer Wave Ping */}
        <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping [animation-duration:3s]" />

        {/* Radar Ring 2 - Middle Pulsing Ring */}
        <div className="absolute inset-4 rounded-full border border-emerald-500/25 animate-pulse [animation-duration:2s]" />

        {/* Radar Ring 3 - Dashed Orbit Ring */}
        <div className="absolute inset-8 rounded-full border border-dashed border-teal-500/30" />

        {/* Shield Spin - High-speed Gradient Ring */}
        <div className="absolute inset-8 rounded-full border-2 border-transparent border-t-cyan-400 border-r-emerald-400 animate-spin [animation-duration:2.5s]" />

        {/* Center Shield Box */}
        <div className="relative flex size-16 sm:size-20 items-center justify-center rounded-2xl border border-slate-700/80 bg-slate-900/90 shadow-[0_0_30px_rgba(6,182,212,0.25)]">
          <ShieldCheck className="size-8 sm:size-10 text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.6)] animate-pulse" />
        </div>
      </div>

      {/* Loading Status Indicator */}
      <div className="relative z-10 mt-8 space-y-2 max-w-sm">
        <p className="font-mono text-sm font-semibold tracking-wider text-slate-200">
          ĐANG TẢI DỮ LIỆU GIAO DỊCH...
        </p>
        <p className="text-xs text-slate-400">
          Bảo vệ giao dịch an toàn tự động
        </p>

        {/* Subtle Shimmer Progress Line */}
        <div className="mx-auto mt-4 h-1 w-44 overflow-hidden rounded-full bg-slate-800/90">
          <div className="h-full w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
        </div>
      </div>

      {/* Protocol Telemetry */}
      <div className="relative z-10 mt-10 font-mono text-[11px] text-slate-600 tracking-widest">
        HỆ THỐNG BẢO VỆ GIAO DỊCH TRUSTPASSZ
      </div>
    </div>
  );
}
