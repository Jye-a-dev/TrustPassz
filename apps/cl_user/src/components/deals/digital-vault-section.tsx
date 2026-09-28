"use client";

import * as React from "react";
import { Lock, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { VaultAuditData } from "./create-deal.types";

export interface DigitalVaultSectionProps {
  rawSecret: string;
  onRawSecretChange: (value: string) => void;
  passphrase: string;
  onPassphraseChange: (value: string) => void;
  vaultAudit: VaultAuditData | null;
  disabled?: boolean;
}

export function DigitalVaultSection({
  rawSecret,
  onRawSecretChange,
  passphrase,
  onPassphraseChange,
  vaultAudit,
  disabled = false,
}: DigitalVaultSectionProps) {
  return (
    <div className="rounded-xl border border-cyan-500/30 bg-slate-900/50 p-4 space-y-3.5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
          <Lock className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
            Digital Vault (Mã hóa đầu cuối AES-256-GCM)
            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 text-[10px]">
              Zero-Knowledge
            </Badge>
          </h4>
          <p className="text-xs text-slate-400">
            Nội dung nhạy cảm được mã hóa trực tiếp trên trình duyệt của bạn trước khi gửi.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="secret-payload"
          className="text-xs font-semibold text-slate-200"
        >
          Nội dung bí mật bàn giao <span className="text-cyan-400">*</span>
        </label>
        <textarea
          id="secret-payload"
          rows={3}
          disabled={disabled}
          placeholder="Dán Link Google Drive riêng tư, License Key kích hoạt, mật khẩu quản trị..."
          value={rawSecret}
          onChange={(e) => onRawSecretChange(e.target.value)}
          className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-cyan-300 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          required
        />
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Plaintext không bao giờ được lưu trữ hoặc đọc bởi máy chủ backend TrustPassz.
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="vault-passphrase"
          className="text-xs font-medium text-slate-300"
        >
          Mật khẩu giải mã Vault (Tùy chọn - nếu để trống sẽ tự sinh ngẫu nhiên 256-bit)
        </label>
        <Input
          id="vault-passphrase"
          type="password"
          disabled={disabled}
          placeholder="Nhập khóa bí mật hoặc để trống để sinh tự động"
          value={passphrase}
          onChange={(e) => onPassphraseChange(e.target.value)}
          className="bg-slate-950/80 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 min-h-11 text-xs font-mono"
        />
      </div>

      {/* Audit preview when generated */}
      {vaultAudit && (
        <div className="rounded-md border border-emerald-500/40 bg-slate-950/90 p-3 space-y-1.5 text-xs text-slate-300 font-mono animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Đã mã hóa cục bộ an toàn:</span>
          </div>
          <div className="truncate">
            <span className="text-slate-500">SHA-256 Hash: </span>
            <span className="text-cyan-300">{vaultAudit.contentHash}</span>
          </div>
          <div className="truncate">
            <span className="text-slate-500">IV (12B): </span>
            <span className="text-slate-300">{vaultAudit.encryptionIv}</span>
          </div>
          <div className="truncate">
            <span className="text-slate-500">Auth Tag (16B): </span>
            <span className="text-slate-300">{vaultAudit.authTag}</span>
          </div>
        </div>
      )}
    </div>
  );
}
