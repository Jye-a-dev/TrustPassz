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
      {/* Page Header */}
      <div className="flex flex-col gap-1 border-b border-slate-800 pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2.5">
          <UserCog className="size-6 text-cyan-400" />
          Cài Đặt Hồ Sơ & Bảo Mật Quản Trị Viên
        </h2>
        <p className="text-xs text-slate-400">
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

