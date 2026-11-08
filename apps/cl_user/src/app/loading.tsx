import { ShieldCheck } from "lucide-react";

export default function RootLoading() {
  return (
    <div className="relative flex min-h-[80vh] w-full flex-col items-center justify-center p-6 text-center bg-canvas text-primary overflow-hidden select-none">
      {/* Background Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-80 sm:size-96 rounded-full bg-rose-500/5 blur-[100px] pointer-events-none" />

      {/* Pulse Radar & Shield Spin Centerpiece */}
      <div className="relative flex size-40 sm:size-48 items-center justify-center">
        {/* Radar Ring 1 */}
        <div className="absolute inset-0 rounded-full border border-rose-200/60 animate-ping [animation-duration:3s]" />

        {/* Radar Ring 2 */}
        <div className="absolute inset-4 rounded-full border border-rose-200 animate-pulse [animation-duration:2s]" />

        {/* Radar Ring 3 */}
        <div className="absolute inset-8 rounded-full border border-dashed border-rose-200" />

        {/* Shield Spin - High-speed Gradient Ring */}
        <div className="absolute inset-8 rounded-full border-2 border-transparent border-t-rose-500 border-r-rose-300 animate-spin [animation-duration:2s]" />

        {/* Center Shield Box */}
        <div className="relative flex size-16 sm:size-20 items-center justify-center rounded-2xl border border-brand-pink/30 bg-surface shadow-sm">
          <ShieldCheck className="size-8 sm:size-10 text-brand-pink animate-pulse" />
        </div>
      </div>

      {/* Loading Status Indicator */}
      <div className="relative z-10 mt-8 space-y-2 max-w-sm">
        <p className="font-mono text-sm font-bold tracking-wider text-slate-900">
          ĐANG TẢI DỮ LIỆU GIAO DỊCH...
        </p>
        <p className="text-xs text-slate-500 font-medium">
          Hệ thống bảo vệ giao dịch an toàn 100%
        </p>

        {/* Subtle Shimmer Progress Line */}
        <div className="mx-auto mt-4 h-1 w-44 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full w-full bg-gradient-to-r from-transparent via-rose-500 to-transparent animate-pulse" />
        </div>
      </div>

      {/* Protocol Telemetry */}
      <div className="relative z-10 mt-10 font-mono text-[11px] text-slate-400 tracking-widest font-medium">
        HỆ THỐNG BẢO VỆ GIAO DỊCH TRUSTPASSZ
      </div>
    </div>
  );
}
