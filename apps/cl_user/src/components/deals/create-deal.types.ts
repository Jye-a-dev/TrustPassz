import type * as React from "react";
import { FileCode, Key, Database, Palette, HelpCircle } from "lucide-react";

export type AssetCategory =
  | "SOURCE_CODE"
  | "LICENSE_KEY"
  | "ACCOUNT_CREDENTIAL"
  | "DESIGN_ASSET"
  | "OTHER";

export interface DealRuleSuggestion {
  category: AssetCategory;
  suggested_min_price: number;
  suggested_max_price: number;
  suggested_inspection_hours: 6 | 12 | 24;
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
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export const ASSET_TYPE_OPTIONS: AssetTypeOption[] = [
  {
    value: "SOURCE_CODE",
    label: "Source Code",
    icon: FileCode,
    description: "Kho mã nguồn Git, file nén dự án",
  },
  {
    value: "LICENSE_KEY",
    label: "License Key",
    icon: Key,
    description: "Khóa kích hoạt bản quyền phần mềm",
  },
  {
    value: "ACCOUNT_CREDENTIAL",
    label: "Tài Khoản / API Key",
    icon: Database,
    description: "Thông tin đăng nhập, token bảo mật",
  },
  {
    value: "DESIGN_ASSET",
    label: "Design Asset",
    icon: Palette,
    description: "Figma UI Kit, file 3D, Vector",
  },
  {
    value: "OTHER",
    label: "Tài Sản Khác",
    icon: HelpCircle,
    description: "Dữ liệu số và tài sản trí tuệ khác",
  },
];

export const INSPECTION_HOURS_MAP: Record<number, number> = {
  6: 21600, // 6h = 21,600s
  12: 43200, // 12h = 43,200s
  24: 86400, // 24h = 86,400s
  48: 172800, // 48h = 172,800s
};
