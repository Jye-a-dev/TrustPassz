"use client";

import * as React from "react";
import Link from "next/link";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AuthUser } from "@/lib/auth-store";
import { apiClient } from "@/lib/api-client";
import { supabase } from "@/lib/supabase-client";

interface HeaderUserMenuProps {
  user: AuthUser | null;
  displayName: string;
  userInitials: string;
  formattedWallet: string;
  onLogout: () => void;
  lockedBalanceVND?: number;
}

export function HeaderUserMenu({
  user,
  displayName,
  userInitials,
  formattedWallet,
  onLogout,
  lockedBalanceVND: propLockedBalanceVND,
}: HeaderUserMenuProps) {
  const [localLockedBalance, setLocalLockedBalance] = React.useState<number>(
    propLockedBalanceVND ?? 0
  );

  React.useEffect(() => {
    if (propLockedBalanceVND !== undefined) {
      setLocalLockedBalance(propLockedBalanceVND);
      return;
    }

    let isMounted = true;
    async function fetchLocked() {
      try {
        const dealsRes = await apiClient<
          | { data?: Array<{ state: string; amount: string | number }> }
          | Array<{ state: string; amount: string | number }>
        >("/api/v1/deals?limit=50");

        if (!isMounted) return;
        const val = dealsRes;
        const items = Array.isArray(val) ? val : Array.isArray(val?.data) ? val.data : [];
        const locked = items
          .filter((d) => d.state === "DEPOSITED" || d.state === "IN_INSPECTION")
          .reduce((sum, d) => sum + Number(d.amount || 0), 0);
        setLocalLockedBalance(locked);
      } catch {
        // Fallback silently
      }
    }

    void fetchLocked();

    const channel = supabase
      .channel("public:deals-header-user-menu")
      .on(
        "postgres_changes" as never,
        { event: "*", schema: "public", table: "deals" },
        () => {
          void fetchLocked();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [propLockedBalanceVND, user?.id]);

  const displayBalance = propLockedBalanceVND ?? localLockedBalance;

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Widget Số dư Két Giữ Tiền Tạm Khóa */}
      <Link
        href="/user/deals"
        className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 text-xs font-semibold shadow-sm active:translate-y-0.5 transition-all shrink-0 cursor-pointer"
        title="Tiền đang giữ an toàn trong két bảo vệ. Bấm để xem chi tiết."
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>Két số:</span>
        <span className="font-mono font-bold text-emerald-700">
          {displayBalance.toLocaleString("vi-VN")} ₫
        </span>
      </Link>

      {/* User Avatar Profile Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-strong bg-surface hover:bg-input-bg p-1 sm:px-2.5 sm:py-1.5 shadow-sm transition-all cursor-pointer outline-none focus:ring-2 focus:ring-brand-pink/30"
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-tr from-rose-500 to-amber-500 text-white font-bold text-xs border border-rose-600 shadow-xs">
              {userInitials || "U"}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-primary max-w-28 truncate leading-tight">
                {displayName}
              </span>
              <span className="text-[10px] text-muted font-mono leading-none">
                {formattedWallet}
              </span>
            </div>
            <ChevronDown className="hidden sm:block size-3.5 text-muted" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56 mt-1 border-subtle bg-surface shadow-xl rounded-xl">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="font-bold text-primary text-xs">{displayName}</span>
            <span className="text-[10px] font-mono text-brand-pink truncate">
              {user?.email || formattedWallet}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-border-subtle" />

          <DropdownMenuItem asChild>
            <Link href="/user" className="flex items-center gap-2 cursor-pointer text-secondary hover:text-primary hover:bg-input-bg">
              <User className="size-3.5 text-muted" />
              <span>Hồ sơ cá nhân</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/user/settings" className="flex items-center gap-2 cursor-pointer text-secondary hover:text-primary hover:bg-input-bg">
              <Settings className="size-3.5 text-muted" />
              <span>Cài đặt & Ví rút VietQR</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-border-subtle" />

          <DropdownMenuItem
            onClick={onLogout}
            className="text-brand-pink focus:text-brand-pink-hover focus:bg-brand-pink-tint/40 cursor-pointer flex items-center gap-2"
          >
            <LogOut className="size-3.5" />
            <span>Đăng xuất</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
