"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Fuel,
  LogOut,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Bell,
  User,
  KeyRound,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminMobileSheet } from "@/components/layout/admin-mobile-sheet";
import { useAdminAuthStore } from "@/lib/admin-auth-store";
import { CONTRACT_ADDRESS } from "@/lib/system-monitor";
import { useRelayerBalance } from "@/hooks/use-relayer-balance";
import { toast } from "sonner";

export function AdminNavbar() {
  const { user, logout } = useAdminAuthStore();
  const relayerGas = useRelayerBalance();
  const [unreadCount, setUnreadCount] = React.useState(2);

  const handleRefreshGas = async () => {
    await relayerGas.refresh();
    toast.success("Đã đồng bộ số dư on-chain Gas Relayer (Base Sepolia + Solana).");
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-3 sm:px-4 md:px-6 backdrop-blur-sm shrink-0">
      {/* Left: Mobile Sheet Trigger + Branding */}
      <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
        {/* Mobile Hamburger Drawer (< 1024px) */}
        <AdminMobileSheet relayerGasEth={relayerGas.ethFormatted} />

        {/* Branding Logo */}
        <Link
          href="/dashboard"
          className="flex items-center space-x-2 text-slate-900 hover:opacity-90 transition-opacity"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs">
            <ShieldCheck className="size-4.5 text-white" />
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="font-bold tracking-tight text-slate-900 text-sm">
              TrustPassz
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
              ADMIN
            </span>
          </div>
        </Link>

        <div className="h-4 w-px bg-slate-200 hidden sm:block" />

        {/* Base Sepolia RPC Status Pill */}
        <div className="hidden xl:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-mono">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-slate-500 text-[11px]">Base Sepolia:</span>
          <a
            href={`https://sepolia.basescan.org/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            className="text-slate-700 hover:text-slate-900 flex items-center gap-1 font-semibold text-[11px]"
          >
            {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}
            <ExternalLink className="size-3 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Right: Dual-chain Relayer Gas + Realtime Notifications + User Profile */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Dual-Chain Relayer Gas Tracker Pill */}
        <div
          className={`flex items-center space-x-2 rounded-lg border px-2.5 py-1 text-xs transition-colors min-h-10 sm:min-h-11 ${
            relayerGas.isLowGas
              ? "border-amber-300 bg-amber-50 text-amber-800"
              : "border-slate-200 bg-slate-50 text-slate-600"
          }`}
        >
          <Fuel
            className={`size-4 shrink-0 ${
              relayerGas.isLowGas ? "text-amber-600 animate-pulse" : "text-slate-500"
            }`}
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-2 font-mono text-[11px] sm:text-xs">
              <span
                className={`font-semibold ${
                  relayerGas.isLowEth ? "text-amber-700" : "text-slate-800"
                }`}
                title={`Base Sepolia Relayer: ${relayerGas.evmAddress}`}
              >
                ⛽ {relayerGas.ethFormatted} ETH
              </span>
              <span className="text-slate-300">|</span>
              <span
                className={`font-semibold ${
                  relayerGas.isLowSol ? "text-amber-700" : "text-emerald-700"
                }`}
                title={`Solana Relayer: ${relayerGas.solanaAddress}`}
              >
                ◎ {relayerGas.solFormatted} SOL
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono leading-none mt-0.5">
              ≈ ${relayerGas.totalEquivalentUsd.toFixed(2)} USD (
              {relayerGas.totalEquivalentEth.toFixed(4)} ETH eq)
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefreshGas}
            disabled={relayerGas.isRefreshing}
            aria-label="Làm mới số dư Gas on-chain"
            className="size-7 p-0 text-slate-400 hover:text-slate-700 min-h-7 min-w-7"
          >
            <RefreshCw
              className={`size-3.5 ${
                relayerGas.isRefreshing ? "animate-spin text-slate-700" : ""
              }`}
            />
          </Button>
        </div>

        {/* Realtime Notification Bell */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="Thông báo hệ thống"
              className="relative size-10 min-h-10 min-w-10 border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              <Bell className="size-4.5" />
              {unreadCount > 0 && (
                <span className="absolute 1.5 top-1.5 flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-rose-500" />
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 border-slate-200 bg-white p-2 text-slate-800 shadow-lg">
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100 pb-2">
              <span className="text-xs font-mono font-bold text-slate-900">Thông báo Realtime</span>
              <button
                onClick={() => setUnreadCount(0)}
                className="text-[10px] text-slate-500 hover:text-slate-800 font-mono"
              >
                Đánh dấu đã đọc
              </button>
            </div>
            <div className="divide-y divide-slate-100 my-1">
              <div className="p-2 text-xs hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                  <span className="text-emerald-600 font-semibold">Tất toán thành công</span>
                  <span>1 phút trước</span>
                </div>
                <p className="text-slate-700 mt-1">Kèo ký quỹ #TK-8829 đã hoàn tất giải ngân về ví người bán.</p>
              </div>
              <div className="p-2 text-xs hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                  <span className="text-amber-600 font-semibold">AI Arbitrator Cảnh báo</span>
                  <span>12 phút trước</span>
                </div>
                <p className="text-slate-700 mt-1">Kèo #TK-8814 có sự khác biệt checksum mã nguồn 14%.</p>
              </div>
            </div>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem asChild>
              <Link href="/disputes" className="w-full text-center text-xs text-slate-700 hover:text-slate-900 font-mono block py-1.5">
                Xem toàn bộ hàng đợi tranh chấp →
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Account Menu with Profile, Security & Logout */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2 rounded-lg border-slate-200 bg-white px-2.5 py-1 text-xs hover:bg-slate-50 min-h-10 sm:min-h-11"
            >
              <div className="flex size-6 items-center justify-center rounded-md bg-slate-900 text-white font-bold text-[11px] font-mono">
                {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : "JY"}
              </div>
              <div className="hidden text-left md:block">
                <p className="font-semibold text-slate-800 text-xs leading-none">
                  {user?.displayName || "Jyye yee"}
                </p>
                <p className="text-[9px] text-slate-400 leading-none font-mono mt-0.5">
                  {user?.role || "ADMIN / ARBITRATOR"}
                </p>
              </div>
              <ChevronDown className="size-3.5 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 border-slate-200 bg-white text-slate-800 p-1.5 shadow-lg">
            <DropdownMenuLabel className="p-2">
              <div className="flex flex-col space-y-1">
                <span className="font-semibold text-slate-900">{user?.displayName || "Jyye yee"}</span>
                <span className="text-xs text-slate-400 font-mono truncate">{user?.email || user?.walletAddress || "Quản trị viên"}</span>
                <Badge variant="outline" className="w-fit text-[10px] border-slate-200 text-slate-700 bg-slate-50">
                  Role: {user?.role || "ADMIN"}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem asChild>
              <Link href="/admin/profile" className="cursor-pointer flex items-center gap-2 py-2 text-xs text-slate-700 hover:text-slate-900">
                <User className="size-4 text-slate-500" />
                <span>Hồ sơ cá nhân</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/profile#security" className="cursor-pointer flex items-center gap-2 py-2 text-xs text-slate-700 hover:text-slate-900">
                <KeyRound className="size-4 text-emerald-600" />
                <span>Cài đặt bảo mật & 2FA</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem asChild>
              <Link href="/funding" className="cursor-pointer flex items-center gap-2 py-2 text-xs text-slate-700 hover:text-slate-900">
                <Coins className="size-4 text-amber-600" />
                <span>Nạp Gas Relayer Hub</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem
              onClick={() => logout()}
              className="cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-700 flex items-center gap-2 py-2 text-xs"
            >
              <LogOut className="size-4" />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
