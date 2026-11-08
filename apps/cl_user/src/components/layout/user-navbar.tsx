"use client";

import * as React from "react";
import Link from "next/link";
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
  CheckCircle2,
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
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { getSmartAvatarUrl } from "@/lib/avatar-helper";

interface UserNavbarProps {
  onOpenMobileMenu?: () => void;
  lockedBalanceVND?: number;
}

export function UserNavbar({
  onOpenMobileMenu,
  lockedBalanceVND = 0,
}: UserNavbarProps) {
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
  const smartAvatarUrl = getSmartAvatarUrl(user);
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
    <div className="flex h-16 w-full items-center justify-between border-b border-subtle bg-surface/95 dark:bg-slate-950/95 px-4 sm:px-6 backdrop-blur-md transition-colors duration-150">
      {/* Left: Mobile hamburger, Brand & Quick Links */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onOpenMobileMenu}
          className="md:hidden min-h-11 min-w-11 border border-subtle bg-surface text-primary hover:bg-input-bg shadow-sm"
          aria-label="Mở bảng điều hướng"
        >
          <Menu className="size-5" />
        </Button>

        <Link
          href="/user"
          className="flex items-center gap-2.5 transition-transform hover:scale-[1.02] md:hidden"
        >
          <div className="flex size-9 items-center justify-center rounded-xl bg-brand-pink-tint border border-brand-pink/30 text-brand-pink shadow-sm">
            <ShieldCheck className="size-5 text-brand-pink" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-primary">
            TrustPassz
          </span>
        </Link>

        {/* Desktop Quick Nav to Explore */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-subtle bg-surface hover:bg-input-bg text-secondary hover:text-brand-pink text-xs font-semibold shadow-2xs transition-all active:translate-y-0.5"
          >
            <span>Khám phá Sàn</span>
          </Link>
        </div>
      </div>

      {/* Right Action Widgets */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Launch "Tạo Giao Dịch" CTA */}
        <Button
          asChild
          size="sm"
          className="hidden sm:inline-flex min-h-9 px-3.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs gap-1.5 border border-rose-600 shadow-sm active:translate-y-0.5 cursor-pointer"
        >
          <Link href="/user/deals/create">
            <Plus className="size-3.5 stroke-3" />
            <span>+ Tạo Kèo Mới</span>
          </Link>
        </Button>

        {/* Escrow Locked Balance Widget */}
        <Link
          href="/user/deals"
          className="hidden lg:inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 shadow-2xs hover:bg-emerald-100/70 transition-colors"
          title="Két giữ tiền bảo chứng tự động"
        >
          <div className="p-1 rounded-md bg-emerald-100 border border-emerald-300 text-emerald-700">
            <Lock className="size-3.5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[9px] uppercase tracking-wider font-semibold text-emerald-800 leading-none font-mono">
              Két Giữ Tiền
            </span>
            <span className="font-mono text-xs font-bold text-emerald-800 leading-tight">
              {lockedBalanceVND.toLocaleString("vi-VN")} ₫
            </span>
          </div>
        </Link>

        {/* Theme Toggle (Light / Dark / System) */}
        <ThemeToggle />

        {/* Realtime Notification Bell */}
        <button
          type="button"
          className="relative flex size-9 items-center justify-center rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all cursor-pointer"
          title="Thông báo biến động giao dịch"
          aria-label="Thông báo"
        >
          <Bell className="size-4" />
          <span className="absolute -top-0.5 -right-0.5 flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-rose-500" />
          </span>
        </button>

        {/* User Profile Avatar Dropdown */}
        {mounted && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 sm:px-2.5 sm:py-1 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all cursor-pointer outline-none focus:ring-2 focus:ring-rose-200"
              >
                <div className="relative">
                  {smartAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={smartAvatarUrl}
                      alt={displayName}
                      className="size-7 rounded-lg object-cover border border-rose-600/40 bg-slate-100 dark:bg-slate-800"
                    />
                  ) : (
                    <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-r from-rose-500 to-amber-500 text-xs font-black text-white border border-rose-600 shadow-xs">
                      {userInitials || "U"}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 size-2 bg-emerald-500 border border-white dark:border-slate-950 rounded-full" />
                </div>

                <div className="hidden sm:flex flex-col text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 max-w-28 truncate leading-tight">
                      {displayName}
                    </span>
                    <CheckCircle2 className="size-3 text-emerald-600 shrink-0" />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono leading-none">
                    {formattedWallet}
                  </span>
                </div>
                <ChevronDown className="hidden sm:block size-3.5 text-slate-400" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-60 mt-1 border-slate-200 bg-white shadow-xl rounded-xl">
              <DropdownMenuLabel className="flex flex-col gap-1 p-3 bg-slate-50 rounded-t-lg border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">{displayName}</span>
                  <Badge variant="outline" className="text-[9px] border-emerald-300 text-emerald-800 bg-emerald-50 font-mono px-1.5 py-0">
                    {user?.role || "USER"}
                  </Badge>
                </div>
                <span className="text-[10px] font-mono text-rose-600 truncate">
                  {user?.email || formattedWallet}
                </span>
              </DropdownMenuLabel>

              <DropdownMenuItem asChild>
                <Link href="/user" className="flex items-center gap-2 cursor-pointer py-2 text-slate-700 hover:bg-slate-50">
                  <User className="size-3.5 text-slate-500" />
                  <span>Bàn điều hành cá nhân</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/user/orders" className="flex items-center gap-2 cursor-pointer py-2 text-slate-700 hover:bg-slate-50">
                  <Coins className="size-3.5 text-slate-500" />
                  <span>Lịch sử đơn &amp; Biên lai</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/user/settings" className="flex items-center gap-2 cursor-pointer py-2 text-slate-700 hover:bg-slate-50">
                  <Settings className="size-3.5 text-slate-500" />
                  <span>Cài đặt STK VietQR</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/deals/demo" className="flex items-center gap-2 cursor-pointer py-2 text-slate-700 hover:bg-slate-50">
                  <Sparkles className="size-3.5 text-rose-500" />
                  <span>Thương lượng giao dịch mẫu</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-slate-100" />

              <DropdownMenuItem
                onClick={handleLogout}
                className="text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer flex items-center gap-2 py-2"
              >
                <LogOut className="size-3.5" />
                <span>Đăng xuất phiên làm việc</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
