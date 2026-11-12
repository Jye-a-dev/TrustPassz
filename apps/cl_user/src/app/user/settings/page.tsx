"use client";

import * as React from "react";
import {
  Settings,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth-store";
import { ProfileSettingsCard } from "@/components/settings/profile-settings-card";
import { ThemeSettingsCard } from "@/components/settings/theme-settings-card";
import { BankSettlementCard } from "@/components/settings/bank-settlement-card";

export default function UserSettingsPage() {
  const { user } = useAuthStore();

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-12 sm:pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 shrink-0">
              <Settings className="size-6" />
            </div>
            <span>Cài Đặt Tài Khoản &amp; Ví Nhận Tiền</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý hồ sơ cá nhân, giao diện hệ thống và số tài khoản ngân hàng nhận tiền giải ngân tự động.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Profile & System Theme */}
        <div className="lg:col-span-6 space-y-6">
          <ProfileSettingsCard />
          <ThemeSettingsCard />
        </div>

        {/* Right Column: Bank Account & Security */}
        <div className="lg:col-span-6 space-y-6">
          <BankSettlementCard />

          {/* Card: Bảo Mật Sinh Trắc Học Passkey */}
          <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-4 shadow-sm">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 shrink-0">
                <KeyRound className="size-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Bảo Mật Sinh Trắc Học &amp; Passkey
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Xác thực vân tay TouchID / FaceID bảo mật cao, không lo lộ lọt mật khẩu.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase block font-semibold">
                    Khóa sinh trắc học hiện tại
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                    TouchID / Windows Hello
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-400">
                  Đang hoạt động
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase block font-semibold">
                    Mã định danh an toàn trên sàn
                  </span>
                  <span className="font-mono text-slate-900 dark:text-white font-bold">
                    {user?.walletAddress || "0x8B4f...3a29"}
                  </span>
                </div>
                <ShieldCheck className="size-4 text-emerald-600" />
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => toast.success("Khóa bảo mật sinh trắc học đã sẵn sàng!")}
              className="w-full min-h-11 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
            >
              <KeyRound className="size-4 text-slate-700 dark:text-slate-300" />
              <span>Thêm Thiết Bị Xác Thực Sinh Trắc Học Mới</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
