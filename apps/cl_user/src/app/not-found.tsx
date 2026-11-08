import Link from "next/link";
import { Home, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center px-4 sm:px-6 py-12 text-center select-none">
      <div className="max-w-lg w-full bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm flex flex-col items-center space-y-6">
        {/* Code Badge */}
        <span className="px-3.5 py-1 text-xs font-mono font-bold tracking-wider uppercase border border-rose-200 bg-rose-50 text-rose-700 rounded-full inline-block">
          MÃ LỖI 404 • KHÔNG TÌM THẤY TRANG
        </span>

        {/* 404 Big Display */}
        <div className="font-mono text-7xl sm:text-8xl font-black text-slate-900 tracking-tight my-1">
          404
        </div>

        {/* Heading & Description */}
        <div className="space-y-2 max-w-sm">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            Sản Phẩm Hoặc Giao Dịch Không Tồn Tại
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Đường dẫn bạn truy cập có thể đã hết hạn, sản phẩm đã bán xong hoặc mã giao dịch không tồn tại trên sàn TrustPassz.
          </p>
        </div>

        {/* Action buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center gap-3 w-full">
          <Button
            asChild
            className="w-full sm:flex-1 min-h-11.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-xs transition-colors border border-slate-950"
          >
            <Link href="/">
              <Home className="size-4" />
              <span>Trở về Trang Chủ</span>
            </Link>
          </Button>

          <Button
            asChild
            className="w-full sm:flex-1 min-h-11.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-md transition-all border border-rose-600"
          >
            <Link href="/explore">
              <Compass className="size-4" />
              <span>Dạo Chợ Sàn Giao Dịch</span>
            </Link>
          </Button>
        </div>

        <div className="pt-2 font-mono text-[11px] text-slate-400">
          ROUTE_DISPATCHER // RESOLVE_FAILED: 404_NOT_FOUND
        </div>
      </div>
    </div>
  );
}
