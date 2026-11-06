"use client";

import * as React from "react";
import { Send, Zap, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { TestSendResponse } from "@/types/emergency-alert";

interface TestSendButtonProps {
  onSuccess?: () => void;
  className?: string;
}

export function TestSendButton({ onSuccess, className }: TestSendButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [latency, setLatency] = React.useState<number | null>(null);

  const handleTestSend = async () => {
    setIsLoading(true);
    setLatency(null);
    const start = performance.now();

    try {
      const response = await apiClient<TestSendResponse>(
        "/api/v1/admin/emergency-alert/test-send",
        {
          method: "POST",
          body: JSON.stringify({
            customMessage: "Thử nghiệm kênh điều phối khẩn cấp từ Admin Portal",
          }),
          timeoutMs: 3000,
        }
      );

      const clientLatency = Math.round(performance.now() - start);
      setLatency(response.latencyMs || clientLatency);

      if (response.success && response.status === "SENT") {
        toast.success("Kiểm tra kết nối SMTP thành công!", {
          description: `Độ trễ: ${response.latencyMs}ms (SLA < 2s). Đã dispatch đến ${response.recipients.length} email cứu hộ.`,
          icon: <CheckCircle2 className="size-4 text-emerald-400" />,
        });
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error("Gửi email kiểm tra thất bại", {
          description: response.error || "Không nhận được phản hồi OK từ SMTP Transporter.",
          icon: <AlertTriangle className="size-4 text-rose-400" />,
        });
      }
    } catch (err) {
      const clientLatency = Math.round(performance.now() - start);
      setLatency(clientLatency);
      const msg = err instanceof Error ? err.message : "Lỗi kết nối máy chủ";
      toast.error("Lỗi khi kiểm tra đường truyền SMTP", {
        description: `${msg} (sau ${clientLatency}ms)`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {latency !== null && (
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-mono">
          <Zap className="size-3 text-cyan-400" />
          <span className="text-slate-400">Latency:</span>
          <span
            className={
              latency < 2000
                ? "text-emerald-400 font-bold"
                : "text-amber-400 font-bold"
            }
          >
            {latency}ms
          </span>
          <span className="text-slate-500 text-[10px]">(&lt;2s SLA)</span>
        </div>
      )}

      <Button
        type="button"
        variant="default"
        onClick={handleTestSend}
        disabled={isLoading}
        className={`relative min-h-11 min-w-11 px-4 bg-linear-to-r from-cyan-600 via-teal-600 to-emerald-600 text-slate-950 font-semibold font-mono tracking-tight hover:from-cyan-500 hover:to-emerald-500 transition-all duration-200 shadow-[0_0_15px_rgba(6,182,212,0.25)] border border-cyan-400/40 cursor-pointer ${
          className || ""
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin text-slate-950" />
            <span>Đang Probe SMTP...</span>
          </>
        ) : (
          <>
            <Send className="mr-2 size-4 text-slate-950" />
            <span>Test Send Emergency Alert</span>
          </>
        )}
      </Button>
    </div>
  );
}

