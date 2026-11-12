"use client";

import * as React from "react";
import { UserCog, ShieldCheck } from "lucide-react";
import { ProfileIdentityCard } from "@/components/profile/profile-identity-card";
import { ProfileSecurityCard } from "@/components/profile/profile-security-card";
import { ProfileNotificationsCard } from "@/components/profile/profile-notifications-card";
import { ProfileAuditLogTable } from "@/components/profile/profile-audit-log-table";

export default function AdminProfilePage() {
  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="text-slate-500 hover:text-slate-800 transition-colors">Cài Đặt</span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-900 font-semibold">Hồ Sơ &amp; Bảo Mật</span>
        </div>
      </div>

      <div>
        <h2 className="text-base font-bold text-slate-900">Cài Đặt Hồ Sơ &amp; Bảo Mật Quản Trị Viên</h2>
        <p className="text-xs text-slate-500">
          Quản lý định danh cá nhân, mã PIN 2FA can thiệp ký quỹ, ví chữ ký on-chain và lịch sử thao tác audit trail.
        </p>
      </div>

      {/* Block 1: Identity Info */}
      <ProfileIdentityCard />

      {/* Block 2: Security & On-chain Signing (PIN 2FA & Linked Wallet) */}
      <ProfileSecurityCard />

      {/* Block 3: Alert & Notification Channels */}
      <ProfileNotificationsCard />

      {/* Block 4: Personal Audit Trail Table */}
      <ProfileAuditLogTable />
    </div>
  );
}

