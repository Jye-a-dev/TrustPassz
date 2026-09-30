"use client";

import * as React from "react";
import { KeyRound, ShieldCheck, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { VaultDigitalAsset } from "./vault.types";

interface VaultUnlockFormProps {
  passphrase: string;
  onPassphraseChange: (val: string) => void;
  onUnlock: () => void;
  isUnlocking: boolean;
  digitalAsset?: VaultDigitalAsset;
}

export function VaultUnlockForm({
  passphrase,
  onPassphraseChange,
  onUnlock,
  isUnlocking,
  digitalAsset,
}: VaultUnlockFormProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-6 shadow-xl">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
            <KeyRound className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Mở Khóa Kho Lưu Trữ Nhận Hàng
              <Badge
                variant="outline"
                className="text-[10px] border-emerald-500/40 text-emerald-300 font-mono"
              >
                Khóa bảo mật
              </Badge>
            </h2>
            <p className="text-xs text-slate-400">
              Dữ liệu được khóa an toàn, chỉ bạn và người bán có thể mở.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="size-4 text-emerald-400" />
          <span>Bảo Mật Tuyệt Đối</span>
        </div>
      </div>

      {/* Passphrase Input & Unlock Button */}
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
          <label
            htmlFor="passphrase-input"
            className="text-xs font-semibold text-slate-300 block"
          >
            Mật khẩu mở khóa nhận hàng
          </label>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <Input
              id="passphrase-input"
              type="password"
              value={passphrase}
              onChange={(e) => onPassphraseChange(e.target.value)}
              placeholder="Nhập mật khẩu mở khóa do người bán cung cấp..."
              className="bg-slate-900 border-slate-700 text-xs font-mono min-h-11"
            />

            <Button
              type="button"
              onClick={onUnlock}
              disabled={isUnlocking || !passphrase}
              className="min-h-11 sm:min-w-44 bg-linear-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-md cursor-pointer"
            >
              {isUnlocking ? (
                <span>Đang mở khóa...</span>
              ) : (
                <>
                  <Unlock className="size-4 mr-1.5" />
                  Mở Khóa Nhận Hàng
                </>
              )}
            </Button>
          </div>

          <p className="text-[11px] text-slate-400">
            Gợi ý: Hệ thống đã tự động điền sẵn mật khẩu mở khóa của giao dịch này để bạn thử nghiệm nhanh.
          </p>
        </div>

        {/* Locked Vault Metadata Preview */}
        {digitalAsset && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-sans">
                Định dạng
              </span>
              <span className="text-cyan-300 font-bold">
                {digitalAsset.assetType}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 truncate">
              <span className="text-[10px] text-slate-400 block font-sans">
                Mã xác thực 1
              </span>
              <span className="text-slate-300">
                {digitalAsset.encryptionIv}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 truncate">
              <span className="text-[10px] text-slate-400 block font-sans">
                Mã xác thực 2
              </span>
              <span className="text-slate-300">
                {digitalAsset.authTag}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
