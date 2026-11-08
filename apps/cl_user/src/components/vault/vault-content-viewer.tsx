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
    <div className="rounded-2xl sm:rounded-3xl border-2 border-emerald-500 bg-white p-6 sm:p-8 space-y-4 shadow-sm animate-in fade-in zoom-in-95 duration-300">
      {/* Security Notice Banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
        <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-600" />
        <div>
          <strong className="block font-bold">
            Lưu Ý Bảo Mật Khi Kiểm Tra Hàng:
          </strong>
          <span>
            Thông tin bàn giao chỉ mở khóa trong phiên kiểm tra này. Hãy lưu lại cẩn thận hoặc sao chép an toàn.
          </span>
        </div>
      </div>

      {/* Plaintext Content Card */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              NỘI DUNG BÀN GIAO ĐÃ MỞ KHÓA
            </span>
            {integrityVerified && (
              <Badge className="bg-emerald-50 border-emerald-200 text-emerald-800 text-[10px] font-bold">
                ✓ SHA-256 ĐÃ ĐỐI CHIẾU
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Eye Toggle */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onToggleVisibility}
              className="min-h-11 border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold gap-1 rounded-xl cursor-pointer"
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
              className="min-h-11 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-1.5 shadow-xs border border-rose-700 rounded-xl cursor-pointer"
            >
              {clipboardCountdown !== null ? (
                <>
                  <Clock className="size-3.5 animate-spin" />
                  <span>Hủy sau {clipboardCountdown}s</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span>Sao chép toàn bộ</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Credential Raw Display */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 font-mono text-xs overflow-x-auto text-slate-800 leading-relaxed max-h-64 custom-scrollbar shadow-inner">
          {isPlaintextVisible ? (
            <pre className="whitespace-pre-wrap break-all select-all font-mono">
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
            <div className="flex items-center justify-between text-[10px] text-amber-800 font-mono font-semibold">
              <span className="flex items-center gap-1">
                <Trash2 className="size-3 text-amber-600" /> Bộ nhớ tạm sẽ tự động xóa sạch sau
              </span>
              <span>{clipboardCountdown} giây</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-amber-500 transition-all duration-1000"
                style={{ width: `${(clipboardCountdown / 30) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
