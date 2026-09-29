"use client";

import * as React from "react";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Copy,
  Clock,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface VaultContentViewerProps {
  decryptedPlaintext: string;
  integrityVerified: boolean;
  isPlaintextVisible: boolean;
  onToggleVisibility: () => void;
  onCopy: () => void;
  clipboardCountdown: number | null;
}

export function VaultContentViewer({
  decryptedPlaintext,
  integrityVerified,
  isPlaintextVisible,
  onToggleVisibility,
  onCopy,
  clipboardCountdown,
}: VaultContentViewerProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-300">
      {/* Security Notice Banner */}
      <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-3.5 flex items-start gap-2.5 text-xs text-amber-300">
        <AlertTriangle className="size-4 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold">
            Bảo Mật Single-View Phiên Đồng Kiểm:
          </strong>
          <span>
            Tài sản số chỉ được mở khóa trong phiên đồng kiểm này. Hãy lưu trữ an toàn hoặc sử dụng tính năng tự hủy clipboard.
          </span>
        </div>
      </div>

      {/* Plaintext Content Card */}
      <div className="rounded-xl border border-emerald-500/40 bg-slate-950 p-4 space-y-3 shadow-inner">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Nội dung tài sản đã giải mã
            </span>
            {integrityVerified && (
              <Badge className="bg-emerald-950 border-emerald-500/40 text-emerald-300 text-[10px]">
                SHA-256 Verified
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Eye Toggle */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onToggleVisibility}
              className="min-h-10 text-slate-400 hover:text-white text-xs gap-1 cursor-pointer"
            >
              {isPlaintextVisible ? (
                <>
                  <EyeOff className="size-3.5" />
                  <span>Ẩn</span>
                </>
              ) : (
                <>
                  <Eye className="size-3.5" />
                  <span>Hiện</span>
                </>
              )}
            </Button>

            {/* Copy Button with 30s self-destruct */}
            <Button
              type="button"
              size="sm"
              onClick={onCopy}
              className="min-h-10 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs gap-1.5 shadow-md cursor-pointer"
            >
              {clipboardCountdown !== null ? (
                <>
                  <Clock className="size-3.5 animate-spin" />
                  <span>Hủy sau {clipboardCountdown}s</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span>Sao chép (Tự hủy 30s)</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Credential Raw Display */}
        <div className="p-3 rounded-lg bg-black/60 border border-slate-800 font-mono text-xs overflow-x-auto text-emerald-300 leading-relaxed max-h-64 custom-scrollbar">
          {isPlaintextVisible ? (
            <pre className="whitespace-pre-wrap break-all">
              {decryptedPlaintext}
            </pre>
          ) : (
            <div className="text-slate-400 italic py-2">
              •••••••••••••••••••••••••••••••••••••••••••••••• (Đã ẩn vì bảo mật)
            </div>
          )}
        </div>

        {/* Clipboard Self-destruct Progress Bar */}
        {clipboardCountdown !== null && (
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[10px] text-amber-400 font-mono">
              <span className="flex items-center gap-1">
                <Trash2 className="size-3" /> Bộ nhớ tạm sẽ tự động xóa sạch
              </span>
              <span>{clipboardCountdown} giây</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-amber-400 transition-all duration-1000"
                style={{ width: `${(clipboardCountdown / 30) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
