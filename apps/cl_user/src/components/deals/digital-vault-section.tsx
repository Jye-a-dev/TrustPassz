"use client";

import * as React from "react";
import { Lock, ShieldCheck, CheckCircle2, AlertTriangle, FileCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AssetCategory, VaultAuditData } from "./create-deal.types";

export interface DigitalVaultSectionProps {
  assetType?: AssetCategory;
  rawSecret: string;
  onRawSecretChange: (value: string) => void;
  passphrase: string;
  onPassphraseChange: (value: string) => void;
  vaultAudit: VaultAuditData | null;
  disabled?: boolean;
}

export function DigitalVaultSection({
  assetType = "SOURCE_CODE",
  rawSecret,
  onRawSecretChange,
  passphrase,
  onPassphraseChange,
  vaultAudit,
  disabled = false,
}: DigitalVaultSectionProps) {
  const isPhysical = assetType === "PHYSICAL_ITEM";

  // Dynamic label & placeholder based on product category
  const config = React.useMemo(() => {
    switch (assetType) {
      case "PHYSICAL_ITEM":
        return {
          title: "Biên Lai Ngoại Quan & Niêm Phong Vault (AES-256-GCM)",
          subtitle:
            "Cam kết tình trạng thực tế & Serial/IMEI được mã hóa thành biên lai bất biến trên Smart Contract để đối chiếu khi bưu tá đồng kiểm.",
          label: "Mô tả cam kết ngoại quan / Mã định danh kiện hàng",
          placeholder:
            "Nhập số IMEI/Serial, mô tả chi tiết khuyết tật ban đầu hoặc link video quay rõ tình trạng món đồ...",
          badgeText: "Smart Receipt",
          badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          noticeText:
            "Không mua bán hàng cấm, hàng nhái kém chất lượng. Tiền cọc được khóa an toàn tới khi bưu tá giao thành công.",
          noticeIcon: AlertTriangle,
          noticeColor: "text-amber-400",
        };
      case "DOCUMENT":
        return {
          title: "Digital Vault (Mã hóa đầu cuối AES-256-GCM)",
          subtitle:
            "Link tài liệu được mã hóa đầu cuối Zero-Knowledge, chỉ mở khóa duy nhất cho người mua sau khi hoàn tất ký quỹ.",
          label: "Nội dung bí mật bàn giao (Link tài liệu)",
          placeholder:
            "Nhập link Google Drive tải tài liệu (chế độ tải 1 lần) hoặc link file PDF/ZIP...",
          badgeText: "Bản Quyền Số",
          badgeClass: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
          noticeText:
            "Cam kết tài liệu chính chủ tự biên soạn hoặc tài nguyên bản quyền mở (Creative Commons).",
          noticeIcon: FileCheck,
          noticeColor: "text-emerald-400",
        };
      case "LICENSE_KEY":
        return {
          title: "Digital Vault (Mã hóa đầu cuối AES-256-GCM)",
          subtitle:
            "Khóa kích hoạt phần mềm được niêm phong an toàn và giải phóng tự động khi bên mua nghiệm thu.",
          label: "Nội dung bí mật bàn giao (Khóa bản quyền / Token)",
          placeholder:
            "Dán License Key, Mã kích hoạt phần mềm, SaaS Token hoặc tài khoản bản quyền...",
          badgeText: "Zero-Knowledge",
          badgeClass: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
          noticeText:
            "Plaintext không bao giờ được lưu trữ hoặc đọc bởi máy chủ backend TrustPassz.",
          noticeIcon: ShieldCheck,
          noticeColor: "text-emerald-400",
        };
      case "DESIGN_ASSET":
        return {
          title: "Digital Vault (Mã hóa đầu cuối AES-256-GCM)",
          subtitle:
            "Kho lưu trữ đồ họa nén hoặc link Figma được bảo mật quyền truy cập qua thuật toán AES-256.",
          label: "Nội dung bí mật bàn giao (Kho tài nguyên thiết kế)",
          placeholder:
            "Dán link Figma file, kho lưu trữ vector/3D hoặc link Google Drive asset...",
          badgeText: "Zero-Knowledge",
          badgeClass: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
          noticeText:
            "Tài nguyên đồ họa được bảo vệ tính toàn vẹn và quyền sử dụng theo thỏa thuận.",
          noticeIcon: ShieldCheck,
          noticeColor: "text-emerald-400",
        };
      case "OTHER":
        return {
          title: "Digital Vault (Mã hóa đầu cuối AES-256-GCM)",
          subtitle:
            "Dữ liệu số được mã hóa đầu cuối Zero-Knowledge trước khi lưu vào Smart Vault.",
          label: "Nội dung bí mật bàn giao",
          placeholder:
            "Dán dữ liệu mật, hướng dẫn bí mật hoặc thông tin bàn giao thỏa thuận riêng...",
          badgeText: "Zero-Knowledge",
          badgeClass: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
          noticeText:
            "Plaintext không bao giờ được lưu trữ hoặc đọc bởi máy chủ backend TrustPassz.",
          noticeIcon: ShieldCheck,
          noticeColor: "text-emerald-400",
        };
      case "SOURCE_CODE":
      default:
        return {
          title: "Digital Vault (Mã hóa đầu cuối AES-256-GCM)",
          subtitle:
            "Nội dung nhạy cảm được mã hóa trực tiếp trên trình duyệt của bạn trước khi gửi.",
          label: "Nội dung bí mật bàn giao (Mã nguồn / Repo)",
          placeholder:
            "Dán Repo link (kèm token đọc), commit hash hoặc link kho lưu trữ mã nguồn nén...",
          badgeText: "Zero-Knowledge",
          badgeClass: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
          noticeText:
            "Bên bán cam kết mã nguồn sạch, không backdoor và có quyền sở hữu hợp pháp.",
          noticeIcon: ShieldCheck,
          noticeColor: "text-emerald-400",
        };
    }
  }, [assetType]);

  const NoticeIcon = config.noticeIcon;

  return (
    <div
      className={cn(
        "rounded-xl border p-4 space-y-3.5 relative overflow-hidden backdrop-blur-sm transition-colors",
        isPhysical
          ? "border-amber-500/30 bg-linear-to-b from-amber-950/20 via-slate-900/50 to-slate-900/40"
          : "border-cyan-500/30 bg-slate-900/50"
      )}
    >
      <div
        className={cn(
          "absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none",
          isPhysical ? "bg-amber-500/10" : "bg-cyan-500/5"
        )}
      />

      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "p-2 rounded-lg border",
            isPhysical
              ? "bg-amber-950/70 border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
              : "bg-cyan-950/60 border-cyan-500/40 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
          )}
        >
          <Lock className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <span>{config.title}</span>
            <Badge className={cn("text-[10px]", config.badgeClass)}>
              {config.badgeText}
            </Badge>
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            {config.subtitle}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="secret-payload"
          className="text-xs font-semibold text-slate-200"
        >
          {config.label} <span className="text-cyan-400">*</span>
        </label>
        <textarea
          id="secret-payload"
          rows={3}
          disabled={disabled}
          placeholder={config.placeholder}
          value={rawSecret}
          onChange={(e) => onRawSecretChange(e.target.value)}
          className={cn(
            "w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:ring-2",
            isPhysical
              ? "text-amber-200 focus:ring-amber-500"
              : "text-cyan-300 focus:ring-cyan-500"
          )}
          required
        />
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <NoticeIcon className={cn("w-3.5 h-3.5 shrink-0", config.noticeColor)} />
          <span>{config.noticeText}</span>
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
            <span className="text-slate-400">SHA-256 Hash: </span>
            <span className="text-cyan-300">{vaultAudit.contentHash}</span>
          </div>
          <div className="truncate">
            <span className="text-slate-400">IV (12B): </span>
            <span className="text-slate-200">{vaultAudit.encryptionIv}</span>
          </div>
          <div className="truncate">
            <span className="text-slate-400">Auth Tag (16B): </span>
            <span className="text-slate-200">{vaultAudit.authTag}</span>
          </div>
        </div>
      )}
    </div>
  );
}
