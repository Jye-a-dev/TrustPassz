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
  ShieldAlert,
  CheckCheck,
  Sparkles,
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
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { EmptyState } from "@/components/shared/empty-state";
import { useAdminAuthStore } from "@/lib/admin-auth-store";
import { CONTRACT_ADDRESS } from "@/lib/system-monitor";
import { useRelayerBalance } from "@/hooks/use-relayer-balance";
import { useRealtimeNotifications, AdminNotificationItem } from "@/hooks/use-realtime-notifications";
import { toast } from "sonner";

export function AdminNavbar() {
  const { user, logout } = useAdminAuthStore();
  const relayerGas = useRelayerBalance();
  const {
    notifications,
    unreadCount,
    isLoading: isNotifLoading,
    markAllAsRead,
    markAsRead,
  } = useRealtimeNotifications();

  const handleRefreshGas = async () => {
    await relayerGas.refresh();
    toast.success("Đã đồng bộ số dư on-chain Gas Relayer (Base Sepolia + Solana).");
  };

  const getSeverityBadgeClass = (severity: AdminNotificationItem["severity"]) => {
    switch (severity) {
      case "CRITICAL":
        return "text-rose-600 dark:text-rose-400 font-semibold";
      case "WARNING":
        return "text-amber-600 dark:text-amber-400 font-semibold";
      case "SUCCESS":
        return "text-emerald-600 dark:text-emerald-400 font-semibold";
      default:
        return "text-cyan-600 dark:text-cyan-400 font-semibold";
    }
  };

  const initials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "AD";

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border-subtle bg-surface/95 px-3 sm:px-4 md:px-6 backdrop-blur-sm shrink-0 transition-colors">
      {/* Left: Mobile Sheet Trigger + Branding */}
      <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
        <AdminMobileSheet relayerGasEth={relayerGas.ethFormatted} />

        {/* Branding Logo */}
        <Link
          href="/dashboard"
          className="flex items-center space-x-2 text-text-primary hover:opacity-90 transition-opacity"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-text-primary text-text-inverse shadow-xs">
            <ShieldCheck className="size-4.5" />
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="font-bold tracking-tight text-text-primary text-sm">
              TrustPassz
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-text-muted border border-border-subtle font-semibold">
              ADMIN
            </span>
          </div>
        </Link>

        <div className="h-4 w-px bg-border-subtle hidden sm:block" />

        {/* Base Sepolia RPC Status Pill */}
        <div className="hidden xl:flex items-center gap-2 rounded-full border border-border-subtle bg-muted/40 px-2.5 py-1 text-xs font-mono">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-text-muted text-[11px]">Base Sepolia:</span>
          <a
            href={`https://sepolia.basescan.org/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            className="text-text-primary hover:underline flex items-center gap-1 font-semibold text-[11px]"
          >
            {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}
            <ExternalLink className="size-3 text-text-muted" />
          </a>
        </div>
      </div>

      {/* Right: Relayer Gas + Theme Switch + Realtime Notifications + Profile */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Dual-Chain Relayer Gas Tracker Pill */}
        <div
          className={`hidden md:flex items-center space-x-2 rounded-lg border px-2.5 py-1 text-xs transition-colors min-h-10 sm:min-h-11 ${
            relayerGas.isLowGas
              ? "border-amber-400/50 bg-amber-500/10 text-amber-500"
              : "border-border-subtle bg-muted/40 text-text-muted"
          }`}
        >
          <Fuel
            className={`size-4 shrink-0 ${
              relayerGas.isLowGas ? "text-amber-500 animate-pulse" : "text-text-muted"
            }`}
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-2 font-mono text-[11px] sm:text-xs">
              <span
                className={`font-semibold ${
                  relayerGas.isLowEth ? "text-amber-500" : "text-text-primary"
                }`}
                title={`Base Sepolia Relayer: ${relayerGas.evmAddress}`}
              >
                ⛽ {relayerGas.ethFormatted} ETH
              </span>
              <span className="text-border-strong">|</span>
              <span
                className={`font-semibold ${
                  relayerGas.isLowSol ? "text-amber-500" : "text-emerald-500"
                }`}
                title={`Solana Relayer: ${relayerGas.solanaAddress}`}
              >
                ◎ {relayerGas.solFormatted} SOL
              </span>
            </div>
            <span className="text-[10px] text-text-muted font-mono leading-none mt-0.5">
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
            className="size-7 p-0 text-text-muted hover:text-text-primary min-h-7 min-w-7"
          >
            <RefreshCw
              className={`size-3.5 ${
                relayerGas.isRefreshing ? "animate-spin text-text-primary" : ""
              }`}
            />
          </Button>
        </div>

        {/* 1. Theme Toggle Switch (Sun / Moon) */}
        <ThemeToggle />

        {/* 2. Realtime Notification Bell (Zero Mock Data) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="Thông báo hệ thống realtime"
              className="relative size-10 min-h-10 min-w-10 border-border-subtle bg-surface text-text-primary hover:bg-muted"
            >
              <Bell className="size-4.5" />
              {unreadCount > 0 && (
                <span className="absolute 1.5 top-1.5 flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-rose-500" />
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-84 sm:w-96 border-border-subtle bg-surface p-2 text-text-primary shadow-xl rounded-xl"
          >
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border-subtle pb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-bold text-text-primary">
                  Thông báo Realtime
                </span>
                {unreadCount > 0 && (
                  <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 bg-rose-500/10 text-rose-500 border-rose-500/30">
                    {unreadCount} mới
                  </Badge>
                )}
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] text-text-muted hover:text-text-primary font-mono flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <CheckCheck className="size-3" />
                  <span>Đã đọc</span>
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-border-subtle my-1">
              {isNotifLoading && notifications.length === 0 ? (
                <div className="p-4 text-center text-xs text-text-muted font-mono">
                  Đang đồng bộ sự kiện realtime...
                </div>
              ) : notifications.length === 0 ? (
                <EmptyState
                  icon={<Bell className="size-5 text-text-muted" />}
                  title="Chưa có thông báo mới"
                  description="Không có giao dịch, khiếu nại hay cảnh báo khẩn cấp nào phát sinh gần đây."
                  className="py-6 border-none"
                />
              ) : (
                notifications.map((item) => (
                  <Link
                    key={item.id}
                    href={item.linkUrl}
                    onClick={() => markAsRead(item.id)}
                    className="block p-2.5 text-xs hover:bg-muted/60 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className={getSeverityBadgeClass(item.severity)}>
                        {item.title}
                      </span>
                      <span className="text-text-muted">
                        {new Date(item.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-text-secondary mt-1 leading-snug line-clamp-2">
                      {item.message}
                    </p>
                  </Link>
                ))
              )}
            </div>

            <DropdownMenuSeparator className="bg-border-subtle" />
            <DropdownMenuItem asChild>
              <Link
                href="/disputes"
                className="w-full text-center text-xs text-text-muted hover:text-text-primary font-mono block py-1.5 cursor-pointer"
              >
                Xem toàn bộ hàng đợi khiếu nại →
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 3. User Account Menu with Avatar, Profile, Security & Logout */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2 rounded-lg border-border-subtle bg-surface px-2.5 py-1 text-xs hover:bg-muted min-h-10 sm:min-h-11"
            >
              <div className="flex size-7 items-center justify-center rounded-lg bg-text-primary text-text-inverse font-bold text-[11px] font-mono overflow-hidden">
                {user?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName || "Admin Avatar"}
                    className="size-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="hidden text-left md:block">
                <p className="font-semibold text-text-primary text-xs leading-none">
                  {user?.displayName || "Quản trị viên"}
                </p>
                <p className="text-[9px] text-text-muted leading-none font-mono mt-0.5">
                  {user?.role || "ADMIN"}
                </p>
              </div>
              <ChevronDown className="size-3.5 text-text-muted" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 border-border-subtle bg-surface text-text-primary p-1.5 shadow-xl rounded-xl"
          >
            <DropdownMenuLabel className="p-2">
              <div className="flex flex-col space-y-1">
                <span className="font-semibold text-text-primary">
                  {user?.displayName || "Quản trị viên"}
                </span>
                <span className="text-xs text-text-muted font-mono truncate">
                  {user?.email || user?.walletAddress || "admin@trustpassz.io"}
                </span>
                <Badge
                  variant="outline"
                  className="w-fit text-[10px] border-border-subtle text-text-secondary bg-muted"
                >
                  Role: {user?.role || "ADMIN"}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border-subtle" />
            <DropdownMenuItem asChild>
              <Link
                href="/settings/profile"
                className="cursor-pointer flex items-center gap-2 py-2 text-xs text-text-secondary hover:text-text-primary"
              >
                <User className="size-4 text-text-muted" />
                <span>Hồ sơ &amp; Đổi Avatar</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/admin/profile#security"
                className="cursor-pointer flex items-center gap-2 py-2 text-xs text-text-secondary hover:text-text-primary"
              >
                <KeyRound className="size-4 text-emerald-500" />
                <span>Cài đặt bảo mật &amp; 2FA PIN</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border-subtle" />
            <DropdownMenuItem asChild>
              <Link
                href="/funding"
                className="cursor-pointer flex items-center gap-2 py-2 text-xs text-text-secondary hover:text-text-primary"
              >
                <Coins className="size-4 text-amber-500" />
                <span>Nạp Gas Relayer Hub</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border-subtle" />
            <DropdownMenuItem
              onClick={() => logout()}
              className="cursor-pointer text-rose-500 focus:bg-rose-500/10 focus:text-rose-600 flex items-center gap-2 py-2 text-xs"
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
