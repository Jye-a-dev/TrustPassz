import type * as React from "react";
import {
  BookOpen,
  Code2,
  KeyRound,
  Palette,
  PackageCheck,
  HelpCircle,
} from "lucide-react";

export type BackendAssetType =
  | "SOURCE_CODE"
  | "LICENSE_KEY"
  | "ACCOUNT_CREDENTIAL"
  | "DESIGN_ASSET"
  | "OTHER";

export type AssetCategory =
  | "DOCUMENT"
  | "SOURCE_CODE"
  | "LICENSE_KEY"
  | "DESIGN_ASSET"
  | "PHYSICAL_ITEM"
  | "OTHER"
  | "ACCOUNT_CREDENTIAL";

export function mapAssetCategoryToBackend(type: AssetCategory): BackendAssetType {
  switch (type) {
    case "SOURCE_CODE":
      return "SOURCE_CODE";
    case "LICENSE_KEY":
      return "LICENSE_KEY";
    case "DESIGN_ASSET":
      return "DESIGN_ASSET";
    case "ACCOUNT_CREDENTIAL":
      return "ACCOUNT_CREDENTIAL";
    case "DOCUMENT":
    case "PHYSICAL_ITEM":
    case "OTHER":
    default:
      return "OTHER";
  }
}

export interface DealRuleSuggestion {
  category: AssetCategory;
  suggested_min_price: number;
  suggested_max_price: number;
  suggested_inspection_hours: 6 | 12 | 24 | 48;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  recommended_rules: string[];
  reasoning: string;
}

export interface VaultAuditData {
  contentHash: string;
  authTag: string;
  encryptionIv: string;
  generatedKey?: string;
}

export interface AssetTypeOption {
  value: AssetCategory;
  label: string;
  description: string;
  deliveryMethod: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: "cyan" | "emerald" | "indigo" | "violet" | "amber" | "slate";
  badgeText?: string;
}

export const ASSET_TYPE_OPTIONS: AssetTypeOption[] = [
  {
    value: "DOCUMENT",
    label: "Tài Liệu / File Số",
    description: "Ebook, giáo trình, template Notion, Excel, checklist PDF",
    deliveryMethod: "Link tải an toàn từ Kho lưu trữ",
    icon: BookOpen,
    accentColor: "cyan",
    badgeText: "PDF / Sheet",
  },
  {
    value: "SOURCE_CODE",
    label: "Mã Nguồn / Source Code",
    description: "Kho mã nguồn Git, file nén dự án, script tự động",
    deliveryMethod: "Link Repo / Khóa truy cập",
    icon: Code2,
    accentColor: "indigo",
    badgeText: "Code / Git",
  },
  {
    value: "LICENSE_KEY",
    label: "License Key / Bản Quyền",
    description: "Khóa kích hoạt phần mềm, SaaS token, tài khoản số",
    deliveryMethod: "Mã kích hoạt gửi tự động",
    icon: KeyRound,
    accentColor: "violet",
    badgeText: "Bản Quyền",
  },
  {
    value: "DESIGN_ASSET",
    label: "File Thiết Kế / Đồ Họa",
    description: "Figma UI Kit, file 3D, Vector, preset Lightroom/CapCut",
    deliveryMethod: "Link kho tài nguyên nén",
    icon: Palette,
    accentColor: "emerald",
    badgeText: "Media / 3D",
  },
  {
    value: "PHYSICAL_ITEM",
    label: "Hàng Thực Tế (Pass Đồ)",
    description: "Quần áo dọn tủ, tai nghe, phím cơ, đồ công nghệ cũ",
    deliveryMethod: "Vận chuyển bưu cục + Đồng kiểm",
    icon: PackageCheck,
    accentColor: "amber",
    badgeText: "Pass Đồ",
  },
  {
    value: "OTHER",
    label: "Tài Sản Khác",
    description: "Dữ liệu số, gói Prompt AI, sở hữu trí tuệ tự do",
    deliveryMethod: "Mở khóa theo thỏa thuận riêng",
    icon: HelpCircle,
    accentColor: "slate",
    badgeText: "Thỏa Thuận",
  },
];

export const INSPECTION_HOURS_MAP: Record<number, number> = {
  6: 21600, // 6h = 21,600s
  12: 43200, // 12h = 43,200s
  24: 86400, // 24h = 86,400s
  48: 172800, // 48h = 172,800s
};
