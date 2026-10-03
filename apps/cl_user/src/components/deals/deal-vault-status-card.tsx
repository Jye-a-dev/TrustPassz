"use client";

import * as React from "react";
import { Lock, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface DealVaultStatusCardProps {
  dealState: string;
  digitalAsset?: {
    assetType?: string;
    encryptedContent?: string;
    encryptionIv?: string;
    authTag?: string;
    contentHash?: string;
  } | null;
}

export function DealVaultStatusCard({
  dealState,
  digitalAsset,
}: DealVaultStatusCardProps) {
  const [copiedHash, setCopiedHash] = React.useState(false);

  const copyHash = () => {
    if (digitalAsset?.contentHash) {
      navigator.clipboard.writeText(digitalAsset.contentHash);
      setCopiedHash(true);
      toast.success("Đã sao chép SHA-256 hash vào clipboard!");
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800/90 bg-slate-900/40 p-5 space-y-3.5">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Trạng Thái Kho Lưu Trữ Bảo Mật
              <Badge
                variant="outline"
                className="text-[10px] border-cyan-500/40 text-cyan-300"
              >
                Bảo Mật Tự Động
              </Badge>
            </h4>
            <p className="text-xs text-slate-400">
              Thông tin bàn giao đã được khóa kín và lưu trữ an toàn.
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-1 rounded-md">
          {dealState === "PENDING"
            ? "Chờ Thanh Toán (Đang Khóa)"
            : "Đã Mở Khóa Nhận Hàng"}
        </span>
      </div>

      {digitalAsset && (
        <div className="space-y-2 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2">
            <div className="truncate flex-1">
              <span className="text-slate-400">Mã kiểm tra bảo mật: </span>
              <span className="text-cyan-300">
                {digitalAsset.contentHash || "Chưa khởi tạo"}
              </span>
            </div>
            {digitalAsset.contentHash && (
              <button
                type="button"
                onClick={copyHash}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Sao chép Content Hash"
              >
                {copiedHash ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
            <div className="p-2 rounded bg-slate-950/60 border border-slate-800/60 truncate">
              <span className="text-slate-500">IV (Hex): </span>
              <span className="text-slate-300">
                {digitalAsset.encryptionIv || "N/A"}
              </span>
            </div>
            <div className="p-2 rounded bg-slate-950/60 border border-slate-800/60 truncate">
              <span className="text-slate-500">Auth Tag (Hex): </span>
              <span className="text-slate-300">
                {digitalAsset.authTag || "N/A"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
