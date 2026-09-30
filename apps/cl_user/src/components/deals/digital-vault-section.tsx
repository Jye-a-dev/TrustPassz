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
          title: "Kho Lưu Trữ Tình Trạng Hàng (Bảo Mật Cao)",
          subtitle:
            "Cam kết tình trạng thực tế & Serial/IMEI được khóa bảo mật trong hệ thống để đối chiếu khi nhận hàng.",
          label: "Thông tin bàn giao & Cam kết ngoại quan",
          placeholder:
            "Dán link ảnh/video quay rõ ngoại quan sản phẩm, số IMEI/Serial, hoặc các lưu ý khi giao nhận...",
          badgeText: "Biên Lai Lưu Trữ",
          badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          noticeText:
            "Không mua bán hàng cấm, hàng nhái. Tiền được giữ an toàn trong két tới khi khách kiểm tra xong.",
          noticeIcon: AlertTriangle,
          noticeColor: "text-amber-400",
        };
      case "DOCUMENT":
        return {
          title: "Kho Lưu Trữ Bảo Mật (Khóa Tự Động)",
          subtitle:
            "Link tài liệu được khóa kín, hệ thống chỉ gửi đúng người mua sau khi tiền đã nạp an toàn vào két.",
          label: "Thông tin bàn giao bí mật (Link file / Tài liệu)",
          placeholder:
            "Dán link Google Drive (chế độ tải), mã bản quyền hoặc mật khẩu bàn giao tại đây (Hệ thống khóa kín, chỉ gửi khi khách đã thanh toán)",
          badgeText: "Khóa Bảo Mật",
          badgeClass: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
          noticeText:
            "Tài liệu được bảo mật tối đa, chỉ người mua hợp lệ mới nhận được link.",
          noticeIcon: FileCheck,
          noticeColor: "text-emerald-400",
        };
      case "LICENSE_KEY":
        return {
          title: "Kho Lưu Trữ Bảo Mật (Khóa Tự Động)",
          subtitle:
            "Khóa bản quyền hoặc tài khoản được khóa kín và chỉ tự động gửi khi người mua thanh toán tiền vào két.",
          label: "Thông tin bàn giao bí mật (Khóa bản quyền / Mật khẩu)",
          placeholder:
            "Dán License Key, mã kích hoạt bản quyền, tài khoản hoặc mật khẩu bàn giao tại đây...",
          badgeText: "Khóa Bảo Mật",
          badgeClass: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
          noticeText:
            "Dữ liệu được khóa an toàn, người ngoài hoặc máy chủ không thể đọc trộm.",
          noticeIcon: ShieldCheck,
          noticeColor: "text-emerald-400",
        };
      case "DESIGN_ASSET":
        return {
          title: "Kho Lưu Trữ Bảo Mật (Khóa Tự Động)",
          subtitle:
            "File thiết kế hoặc link Figma được bảo mật chặt chẽ, chỉ chuyển giao khi khách đã nạp tiền an toàn.",
          label: "Thông tin bàn giao bí mật (Link Figma / File thiết kế)",
          placeholder:
            "Dán link Figma file, link Google Drive tài nguyên thiết kế, file nén...",
          badgeText: "Khóa Bảo Mật",
          badgeClass: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
          noticeText:
            "File thiết kế được bảo vệ tuyệt đối và bàn giao đúng người nhận.",
          noticeIcon: ShieldCheck,
          noticeColor: "text-emerald-400",
        };
      case "OTHER":
        return {
          title: "Kho Lưu Trữ Bảo Mật (Khóa Tự Động)",
          subtitle:
            "Dữ liệu giao dịch được khóa kín, chỉ gửi khi người mua hoàn tất thanh toán vào két giữ tiền.",
          label: "Thông tin bàn giao bí mật",
          placeholder:
            "Dán link Google Drive (chế độ tải), mã bản quyền hoặc mật khẩu bàn giao tại đây (Hệ thống khóa kín, chỉ gửi khi khách đã thanh toán)",
          badgeText: "Khóa Bảo Mật",
          badgeClass: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
          noticeText:
            "Dữ liệu được khóa an toàn, người ngoài hoặc máy chủ không thể đọc trộm.",
          noticeIcon: ShieldCheck,
          noticeColor: "text-emerald-400",
        };
      case "SOURCE_CODE":
      default:
        return {
          title: "Kho Lưu Trữ Bảo Mật (Khóa Tự Động)",
          subtitle:
            "Link mã nguồn được khóa kín ngay trên trình duyệt, chỉ bàn giao sau khi khách đã nạp tiền vào két.",
          label: "Thông tin bàn giao bí mật (Link mã nguồn / Token)",
          placeholder:
            "Dán Repo link (kèm token truy cập), link tải mã nguồn hoặc thông tin bàn giao...",
          badgeText: "Khóa Bảo Mật",
          badgeClass: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
          noticeText:
            "Mã nguồn được khóa an toàn, bàn giao tự động và chính xác.",
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
          Mật khẩu mở khóa (Tùy chọn - nếu để trống hệ thống sẽ tự tạo mật khẩu bảo mật)
        </label>
        <Input
          id="vault-passphrase"
          type="password"
          disabled={disabled}
          placeholder="Nhập mật khẩu mở khóa hoặc để trống để tạo tự động"
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
            <span>Đã khóa an toàn vào Kho bảo mật:</span>
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
