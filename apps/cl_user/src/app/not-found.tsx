import Link from "next/link";
import { FileQuestion, Home, Compass, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[85vh] w-full flex-col items-center justify-center p-6 text-center bg-[#0B0F17] text-slate-100 overflow-hidden select-none">
      {/* Background Ambience Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-96 bg-gradient-to-r from-cyan-500/10 via-emerald-500/10 to-teal-500/5 blur-[130px] pointer-events-none" />

      {/* Protocol Code Badge */}
      <div className="relative z-10 mb-4">
        <Badge
          variant="outline"
          className="px-3.5 py-1.5 text-xs font-mono tracking-widest uppercase border-cyan-500/30 bg-cyan-950/40 text-cyan-300 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.15)]"
        >
          ESCROW PROTOCOL 404 // RESOURCE_NOT_FOUND
        </Badge>
      </div>

      {/* High-Tech Icon Display */}
      <div className="relative z-10 mb-4 flex size-20 sm:size-24 items-center justify-center rounded-2xl border border-cyan-500/30 bg-slate-900/80 text-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.25)]">
        <span className="absolute -inset-1 rounded-2xl border border-cyan-500/20 animate-pulse pointer-events-none" />
        <FileQuestion className="size-10 sm:size-12 text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]" />
      </div>

      {/* Cyber Glitch / Gradient 404 */}
      <div className="relative z-10">
        <span className="text-7xl sm:text-9xl font-black tracking-widest text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text select-none drop-shadow-[0_0_35px_rgba(6,182,212,0.3)]">
          404
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-lg space-y-3 mt-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Không Tìm Thấy Trang Hoặc Kèo Ký Quỹ
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed text-balance">
          Đường dẫn bạn yêu cầu không tồn tại, hợp đồng số đã hết hạn hoặc mã định danh giao dịch trên Base Sepolia không chính xác.
        </p>
      </div>

      {/* Two action buttons with touch target min-height >= 48px */}
      <div className="relative z-10 mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
        <Button
          asChild
          size="lg"
          className="w-full sm:w-auto min-h-[48px] px-8 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-bold hover:brightness-110 shadow-[0_0_25px_rgba(16,185,129,0.35)] transition-all duration-200 border-0"
        >
          <Link href="/" className="flex items-center justify-center gap-2">
            <Home className="size-5" />
            <span>Trở về Trang chủ</span>
          </Link>
        </Button>

        <Button
          asChild
          variant="outline"
          size="lg"
          className="w-full sm:w-auto min-h-[48px] px-7 rounded-xl border-slate-700 bg-slate-900/80 hover:bg-slate-800 hover:border-slate-600 text-slate-200 hover:text-white transition-all duration-200 font-semibold"
        >
          <Link href="/explore" className="flex items-center justify-center gap-2">
            <Compass className="size-5 text-cyan-400" />
            <span>Khám Phá Kèo Giao Dịch</span>
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      {/* Monospace System Telemetry */}
      <div className="relative z-10 mt-12 font-mono text-[11px] text-slate-500 tracking-wider">
        ROUTE_DISPATCHER // RESOLVE_FAILED: TARGET_NOT_RESOLVED
      </div>
    </div>
  );
}
