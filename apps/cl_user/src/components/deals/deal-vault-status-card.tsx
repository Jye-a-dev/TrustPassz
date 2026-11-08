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
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase font-mono flex items-center gap-2">
              KHO LƯU TRỮ BẢO MẬT (AES-256-GCM)
              <Badge
                variant="outline"
                className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-300"
              >
                Tự Động
              </Badge>
            </h4>
            <p className="text-xs text-slate-500">
              Thông tin bàn giao đã được khóa kín. Sẵn sàng mở khóa sau khi quét VietQR.
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shrink-0 self-start sm:self-auto">
          {dealState === "PENDING"
            ? "Chờ Thanh Toán (Đang Khóa)"
            : "Đã Mở Khóa Nhận Hàng"}
        </span>
      </div>

      {digitalAsset && (
        <div className="space-y-2 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
            <div className="truncate flex-1">
              <span className="text-slate-500 font-bold">SHA-256 HASH: </span>
              <span className="text-slate-800 font-bold">
                {digitalAsset.contentHash || "Chưa khởi tạo"}
              </span>
            </div>
            {digitalAsset.contentHash && (
              <button
                type="button"
                onClick={copyHash}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer shadow-2xs"
                title="Sao chép Content Hash"
              >
                {copiedHash ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 truncate">
              <span className="text-slate-400">IV (Hex): </span>
              <span className="text-slate-800 font-medium">
                {digitalAsset.encryptionIv || "N/A"}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 truncate">
              <span className="text-slate-400">Auth Tag (Hex): </span>
              <span className="text-slate-800 font-medium">
                {digitalAsset.authTag || "N/A"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
