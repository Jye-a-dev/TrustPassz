"use client";

import * as React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log error to telemetry service (e.g. Sentry)
    console.error("Application runtime error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 sm:px-6 py-12 text-center">
      <div className="max-w-xl w-full bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm flex flex-col items-center space-y-6">
        {/* Error Icon Badge */}
        <div className="flex size-16 sm:size-20 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 shadow-sm">
          <AlertCircle className="size-8 sm:size-10" />
        </div>

        {/* Error 500 Code Badge */}
        <span className="text-xs font-mono font-bold tracking-wider text-rose-700 uppercase px-3.5 py-1 rounded-full bg-rose-50 border border-rose-200">
          MÃ LỖI 500 • SỰ CỐ MÁY CHỦ XỬ LÝ
        </span>

        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Đã Xảy Ra Sự Cố Không Mong Muốn
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md leading-relaxed mx-auto">
            {error.message ||
              "Hệ thống gặp trục trặc tạm thời trong quá trình xử lý yêu cầu. Đội ngũ kỹ thuật đã nhận thông báo tự động và đang tiến hành xử lý."}
          </p>
        </div>

        {/* Technical Digest Box */}
        {error.digest && (
          <div className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left space-y-1.5">
            <span className="text-slate-500 font-medium text-xs font-mono block">Mã phân tích lỗi:</span>
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 font-mono text-[11px] text-slate-700 break-all select-all">
              digest: {error.digest}
            </div>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full pt-2">
          <Button
            onClick={() => reset()}
            className="w-full sm:flex-1 h-11 px-5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer min-h-[44px] border border-rose-600"
          >
            <RotateCcw className="size-4" />
            <span>Thử lại ngay</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
            className="w-full sm:flex-1 h-11 px-5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors min-h-[44px] shadow-2xs"
          >
            <span>Về trang chủ</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

