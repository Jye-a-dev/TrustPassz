"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Fuel,
  Activity,
  LogOut,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Bell,
  CheckCircle2,
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
import { toast } from "sonner";

export function AdminNavbar() {
  const { user, logout } = useAdminAuthStore();
  const [relayerGasEth, setRelayerGasEth] = React.useState("0.4852");
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(2);

  const handleRefreshGas = async () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setRelayerGasEth((0.45 + Math.random() * 0.08).toFixed(4));
      setIsRefreshing(false);
      toast.success("Đã đồng bộ số dư Gas Oracle Relayer từ Base Sepolia.");
    }, 500);
  };

  const isLowGas = parseFloat(relayerGasEth) < 0.1;

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-[#080C14]/90 px-3 sm:px-4 md:px-6 backdrop-blur-md">
      {/* Left: Mobile Sheet Trigger + Branding */}
      <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
        {/* Mobile Hamburger Drawer (< 1024px) */}
        <AdminMobileSheet relayerGasEth={relayerGasEth} />

        {/* Branding Logo */}
        <Link
          href="/dashboard"
          className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <div className="flex size-10 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-950/40 text-cyan-400 shadow-sm shadow-cyan-900/40">
            <ShieldCheck className="size-5" />
          </div>
          <span className="hidden font-mono font-bold tracking-tight text-white sm:inline-block text-sm">
            TrustPassz{" "}
            <span className="text-cyan-400 text-xs px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50">
              ADMIN
            </span>
          </span>
        </Link>

        {/* Base Sepolia RPC Status Pill */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-slate-800 bg-[#0F172A] px-3 py-1.5 text-xs font-mono">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-slate-400">Base Sepolia:</span>
          <a
            href={`https://sepolia.basescan.org/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
          >
            {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>

      {/* Right: Relayer Gas + Realtime Notifications + User Profile */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Relayer Gas Tracker Pill */}
        <div
          className={`flex items-center space-x-2 rounded-lg border px-2.5 py-1 text-xs transition-colors min-h-[44px] ${
            isLowGas
              ? "border-amber-500/50 bg-amber-950/30 text-amber-300"
              : "border-slate-800 bg-[#0F172A] text-slate-300"
          }`}
        >
          <Fuel className={`size-4 ${isLowGas ? "text-amber-400 animate-pulse" : "text-cyan-400"}`} />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 leading-none font-mono">Relayer Gas</span>
            <span className="font-mono font-semibold leading-tight text-white text-[11px] sm:text-xs">
              {relayerGasEth} ETH
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefreshGas}
            disabled={isRefreshing}
            aria-label="Làm mới số dư Gas"
            className="size-8 p-0 text-slate-400 hover:text-white"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
          </Button>
        </div>

        {/* Realtime Notification Bell */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="Thông báo hệ thống"
              className="relative size-11 min-h-[44px] min-w-[44px] border-slate-800 bg-[#0F172A] text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-cyan-500" />
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 border-slate-800 bg-[#0F172A] p-2 text-slate-200">
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-800 pb-2">
              <span className="text-xs font-mono font-bold text-white">Thông báo Realtime</span>
              <button
                onClick={() => setUnreadCount(0)}
                className="text-[10px] text-cyan-400 hover:underline font-mono"
              >
                Đánh dấu đã đọc
              </button>
            </div>
            <div className="divide-y divide-slate-800/60 my-1">
              <div className="p-2 text-xs hover:bg-slate-800/40 rounded-lg transition-colors cursor-pointer">
                <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                  <span className="text-emerald-400 font-semibold">Tất toán thành công</span>
                  <span>1 phút trước</span>
                </div>
                <p className="text-slate-200 mt-1">Kèo ký quỹ #TK-8829 đã hoàn tất giải ngân về ví người bán.</p>
              </div>
              <div className="p-2 text-xs hover:bg-slate-800/40 rounded-lg transition-colors cursor-pointer">
                <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                  <span className="text-amber-400 font-semibold">AI Arbitrator Cảnh báo</span>
                  <span>12 phút trước</span>
                </div>
                <p className="text-slate-200 mt-1">Kèo #TK-8814 có sự khác biệt checksum mã nguồn 14%.</p>
              </div>
            </div>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem asChild>
              <Link href="/disputes" className="w-full text-center text-xs text-cyan-400 font-mono block py-1.5">
                Xem toàn bộ hàng đợi tranh chấp →
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Account Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 rounded-lg border border-slate-800 bg-[#0F172A] px-2.5 py-1 text-xs hover:bg-slate-800 min-h-[44px]"
            >
              <div className="flex size-7 items-center justify-center rounded-full bg-cyan-950 text-cyan-400 font-semibold text-xs border border-cyan-800">
                {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : "AD"}
              </div>
              <div className="hidden text-left md:block">
                <p className="font-medium text-slate-200 leading-tight">
                  {user?.displayName || "Super Admin"}
                </p>
                <p className="text-[10px] text-slate-400 leading-none font-mono">
                  {user?.role || "ADMIN"}
                </p>
              </div>
              <ChevronDown className="size-3.5 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-slate-800 bg-[#0F172A] text-slate-200">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <span className="font-semibold text-white">{user?.displayName || "Super Admin"}</span>
                <span className="text-xs text-slate-400 font-mono truncate">{user?.email || "admin@trustpassz.io"}</span>
                <Badge variant="outline" className="w-fit text-[10px] border-cyan-800 text-cyan-400 bg-cyan-950/40">
                  Role: {user?.role || "ADMIN"}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="cursor-pointer">
                Bảng điều khiển
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/system-status" className="cursor-pointer">
                5 Trụ cột Hệ thống
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/api-explorer" className="cursor-pointer">
                Super API Explorer
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem
              onClick={() => logout()}
              className="cursor-pointer text-rose-400 focus:bg-rose-950/40 focus:text-rose-300"
            >
              <LogOut className="mr-2 size-3.5" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
