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
    <div className="rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 p-5 sm:p-6 my-4 space-y-4">
      <div className="flex items-center gap-3 text-emerald-950">
        <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200">
          <Lock className="size-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-emerald-900 flex items-center gap-2">
            <span>4. {config.title}</span>
            <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px]">
              {config.badgeText}
            </Badge>
          </h4>
          <p className="text-xs text-slate-600 mt-0.5">
            {config.subtitle}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="secret-payload"
          className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono block"
        >
          {config.label} <span className="text-rose-600">*</span>
        </label>
        <textarea
          id="secret-payload"
          rows={3}
          disabled={disabled}
          placeholder={config.placeholder}
          value={rawSecret}
          onChange={(e) => onRawSecretChange(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 shadow-2xs"
          required
        />
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <NoticeIcon className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
          <span>{config.noticeText}</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="vault-passphrase"
          className="text-xs font-semibold text-slate-700 block font-mono uppercase"
        >
          Mật khẩu mở khóa (Tùy chọn - nếu để trống hệ thống sẽ tự sinh khóa)
        </label>
        <Input
          id="vault-passphrase"
          type="password"
          disabled={disabled}
          placeholder="Nhập mật khẩu mở khóa hoặc để trống để tạo tự động"
          value={passphrase}
          onChange={(e) => onPassphraseChange(e.target.value)}
          className="bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 min-h-[44px] text-xs font-mono shadow-2xs"
        />
      </div>

      {/* Audit preview when generated */}
      {vaultAudit && (
        <div className="rounded-xl border border-emerald-300 bg-white p-3.5 space-y-1.5 text-xs text-slate-700 font-mono shadow-xs">
          <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Đã bảo chứng vào Két bảo mật:</span>
          </div>
          <div className="truncate">
            <span className="text-slate-500">SHA-256 Hash: </span>
            <span className="text-emerald-800 font-bold">{vaultAudit.contentHash}</span>
          </div>
          <div className="truncate text-slate-500">
            <span>IV (12B): </span>
            <span className="text-slate-700">{vaultAudit.encryptionIv}</span>
          </div>
          <div className="truncate text-slate-500">
            <span>Auth Tag (16B): </span>
            <span className="text-slate-700">{vaultAudit.authTag}</span>
          </div>
        </div>
      )}
    </div>
  );
}
