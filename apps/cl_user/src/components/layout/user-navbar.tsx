"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Menu,
  Bell,
  Coins,
  Lock,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Sparkles,
  Plus,
  Flame,
  CheckCircle2,
  Radio,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/lib/auth-store";

interface UserNavbarProps {
  onOpenMobileMenu?: () => void;
  lockedBalanceVND?: number;
}

export function UserNavbar({
  onOpenMobileMenu,
  lockedBalanceVND = 0,
}: UserNavbarProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
  };

  const displayName =
    user?.displayName || user?.email?.split("@")[0] || "Trần Quốc Toản";
  const userInitials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const formattedWallet = user?.walletAddress
    ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
    : "0x8B4f...3a29";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-[#070A10]/90 px-4 sm:px-6 backdrop-blur-2xl">
      {/* Left: Mobile hamburger & Brand */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onOpenMobileMenu}
          className="md:hidden min-h-11 min-w-11 text-slate-300 hover:text-white"
          aria-label="Mở bảng điều hướng"
        >
          <Menu className="size-5" />
        </Button>

        <Link
          href="/user"
          className="flex items-center gap-2.5 transition-transform hover:scale-[1.02] md:hidden"
        >
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/25 via-cyan-500/20 to-emerald-500/10 border border-emerald-500/50 text-emerald-400">
            <ShieldCheck className="size-5 text-emerald-400" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-white">
            TrustPassz
          </span>
        </Link>

        {/* Desktop Left: Live Status Radar */}
        <div className="hidden md:flex items-center gap-2.5 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/80 px-2.5 py-1 font-mono text-[11px]">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-slate-200 font-semibold">Base Sepolia L2</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-md border border-slate-800/60">
            <Flame className="size-3 text-amber-400" />
            <span>1.2 Gwei · Low</span>
          </div>
        </div>
      </div>

      {/* Right Action Widgets */}
      <div className="flex items-center gap-2 sm:gap-3.5">
        {/* Quick Launch "Tạo Kèo" CTA */}
        <Button
          asChild
          size="sm"
          className="hidden sm:inline-flex min-h-9 px-3.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer"
        >
          <Link href="/user/deals/create">
            <Plus className="size-3.5 stroke-3" />
            <span>Tạo Kèo Mới</span>
          </Link>
        </Button>

        {/* Escrow Locked Balance Widget */}
        <div className="hidden lg:flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-950/25 px-3 py-1.5 shadow-[0_0_15px_rgba(6,182,212,0.18)]">
          <div className="p-1 rounded bg-cyan-950/90 border border-cyan-500/40 text-cyan-400">
            <Lock className="size-3.5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 leading-none font-mono">
              Két Khóa Tạm Thời
            </span>
            <span className="font-mono text-xs font-bold text-cyan-300 leading-tight">
              {lockedBalanceVND.toLocaleString("vi-VN")} ₫
            </span>
          </div>
        </div>

        {/* Realtime Notification Bell */}
        <button
          type="button"
          className="relative flex size-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
          title="Thông báo biến động Escrow"
          aria-label="Thông báo"
        >
          <Bell className="size-4" />
          <span className="absolute -top-0.5 -right-0.5 flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-cyan-500" />
          </span>
        </button>

        {/* User Profile Avatar Dropdown */}
        {mounted && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 p-1 sm:px-2.5 sm:py-1 hover:border-cyan-500/40 hover:bg-slate-800 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-cyan-500/40"
              >
                <div className="relative">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500 text-xs font-black text-slate-950 shadow-sm">
                    {userInitials || "U"}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 size-2 bg-emerald-400 border border-slate-900 rounded-full" />
                </div>

                <div className="hidden sm:flex flex-col text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-100 max-w-28 truncate leading-tight">
                      {displayName}
                    </span>
                    <CheckCircle2 className="size-3 text-cyan-400 shrink-0" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono leading-none">
                    {formattedWallet}
                  </span>
                </div>
                <ChevronDown className="hidden sm:block size-3.5 text-slate-400" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-60 mt-1 border-slate-800 bg-[#0B0F17]/95 backdrop-blur-2xl">
              <DropdownMenuLabel className="flex flex-col gap-1 p-3 bg-slate-950/70 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{displayName}</span>
                  <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-300 font-mono px-1.5 py-0">
                    {user?.role || "USER"}
                  </Badge>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 truncate">
                  {user?.email || formattedWallet}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-800" />

              <DropdownMenuItem asChild>
                <Link href="/user" className="flex items-center gap-2 cursor-pointer py-2">
                  <User className="size-3.5 text-slate-400" />
                  <span>Bàn điều hành cá nhân</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/user/orders" className="flex items-center gap-2 cursor-pointer py-2">
                  <Coins className="size-3.5 text-slate-400" />
                  <span>Lịch sử đơn &amp; Biên lai</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/user/settings" className="flex items-center gap-2 cursor-pointer py-2">
                  <Settings className="size-3.5 text-slate-400" />
                  <span>Cài đặt STK VietQR &amp; Passkey</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/deals/demo" className="flex items-center gap-2 cursor-pointer py-2">
                  <Sparkles className="size-3.5 text-emerald-400" />
                  <span>Mô phỏng Đàm phán Demo</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-slate-800" />

              <DropdownMenuItem
                onClick={handleLogout}
                className="text-rose-400 focus:text-rose-300 focus:bg-rose-950/40 cursor-pointer flex items-center gap-2 py-2"
              >
                <LogOut className="size-3.5" />
                <span>Đăng xuất phiên làm việc</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
