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
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center space-y-4 p-6">
      <div className="size-12 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
        <AlertCircle className="size-5 text-rose-600" />
      </div>
      <h2 className="text-lg font-bold text-slate-900">Sự Cố Hệ Thống - Crash Boundary</h2>
      {error.digest && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs text-rose-700 font-mono">
          {error.digest}
        </div>
      )}
      <p className="text-xs text-slate-500 max-w-md">
        {error.message || "Giao dịch broadcast sang Base Sepolia RPC bị gián đoạn. Phiên làm việc đã được giữ an toàn."}
      </p>
      <div className="flex gap-2">
        <Button onClick={() => reset()} className="h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 shadow-2xs">
          <RotateCcw className="size-3.5" />
          <span>Tải lại</span>
        </Button>
        <Button variant="outline" onClick={() => (window.location.href = "/dashboard")} className="h-9 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center shadow-2xs">
          Về trang tổng quan
        </Button>
      </div>
    </div>
  );
}

