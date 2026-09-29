"use client";

import * as React from "react";
import Link from "next/link";
import { Lock, Bell, User, Settings, LogOut, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AuthUser } from "@/lib/auth-store";

interface HeaderUserMenuProps {
  user: AuthUser | null;
  displayName: string;
  userInitials: string;
  formattedWallet: string;
  onLogout: () => void;
}

export function HeaderUserMenu({
  user,
  displayName,
  userInitials,
  formattedWallet,
  onLogout,
}: HeaderUserMenuProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Widget Số dư Két Escrow Tạm Khóa */}
      <div className="hidden xl:flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-950/20 px-2.5 py-1 shadow-[0_0_12px_rgba(6,182,212,0.12)]">
        <div className="p-1 rounded-md bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
          <Lock className="size-3" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 leading-none">
            Két Ký Quỹ
          </span>
          <span className="font-mono text-[11px] font-bold text-cyan-300 leading-tight">
            1.250.000 ₫
          </span>
        </div>
      </div>

      {/* Thông báo chuông biến động Escrow */}
      <button
        type="button"
        className="relative flex size-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
        title="Thông báo biến động Escrow"
        aria-label="Thông báo"
      >
        <Bell className="size-4" />
        <span className="absolute -top-0.5 -right-0.5 flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-cyan-500" />
        </span>
      </button>

      {/* User Avatar Profile Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-1 sm:px-2.5 sm:py-1 hover:border-slate-700 hover:bg-slate-800 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-cyan-500/40"
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-linear-to-br from-cyan-500 to-emerald-500 text-xs font-black text-slate-950 shadow-sm">
              {userInitials || "U"}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-100 max-w-28 truncate leading-tight">
                {displayName}
              </span>
              <span className="text-[10px] text-slate-400 font-mono leading-none">
                {formattedWallet}
              </span>
            </div>
            <ChevronDown className="hidden sm:block size-3.5 text-slate-400" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56 mt-1 border-slate-800 bg-[#0F172A]">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="font-bold text-white text-xs">{displayName}</span>
            <span className="text-[10px] font-mono text-cyan-400 truncate">
              {user?.email || formattedWallet}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-800" />

          <DropdownMenuItem asChild>
            <Link href="/user" className="flex items-center gap-2 cursor-pointer">
              <User className="size-3.5 text-slate-400" />
              <span>Hồ sơ cá nhân</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/user/settings" className="flex items-center gap-2 cursor-pointer">
              <Settings className="size-3.5 text-slate-400" />
              <span>Cài đặt & Ví rút VietQR</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-slate-800" />

          <DropdownMenuItem
            onClick={onLogout}
            className="text-rose-400 focus:text-rose-300 focus:bg-rose-950/40 cursor-pointer flex items-center gap-2"
          >
            <LogOut className="size-3.5" />
            <span>Đăng xuất</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
