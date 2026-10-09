"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  PlusCircle,
  KeyRound,
  Menu,
  LogOut,
  Settings,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { GUEST_NAV_ITEMS, AUTH_NAV_ITEMS } from "./header-nav-links";

interface HeaderMobileDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isAuth: boolean;
  displayName: string;
  userInitials: string;
  formattedWallet: string;
  pathname: string;
  onLogout: () => void;
  lockedBalanceVND?: number;
}

export function HeaderMobileDrawer({
  isOpen,
  onOpenChange,
  isAuth,
  displayName,
  userInitials,
  formattedWallet,
  pathname,
  onLogout,
  lockedBalanceVND = 0,
}: HeaderMobileDrawerProps) {
  return (
    <div className="md:hidden flex items-center">
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            aria-label="Mở menu điều hướng"
          >
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 w-80 max-w-[85vw] flex flex-col justify-between p-6 shadow-2xl"
        >
          <div className="overflow-y-auto pr-1">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2.5 text-left">
                <div className="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500/10 dark:from-emerald-500/20 via-cyan-500/10 dark:via-cyan-500/20 to-emerald-500/5 dark:to-emerald-500/10 border border-emerald-500/30 dark:border-emerald-500/40 shadow-xs p-1">
                  <Image src="/logo.png" alt="TrustPassz" width={28} height={28} className="size-7 object-contain" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">
                    TrustPassz
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-semibold">
                    Bảo Vệ Giao Dịch An Toàn
                  </div>
                </div>
              </SheetTitle>
            </SheetHeader>

            <div className="flex flex-col gap-2.5 mt-6">
              {/* Network Status Badge */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 mb-1">
                <span className="text-slate-500 dark:text-slate-400">Trạng thái bảo vệ:</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  Bảo vệ tự động
                </span>
              </div>

              {isAuth ? (
                <>
                  {/* Profile Info Card trong Drawer */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 mb-2">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-linear-to-br from-cyan-500 to-emerald-500 text-xs font-black text-slate-950 shadow-xs shrink-0">
                      {userInitials || "U"}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {displayName}
                      </span>
                      <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 truncate">
                        {formattedWallet}
                      </span>
                    </div>
                  </div>

                  {/* Két Giữ Tiền Widget trong Mobile Drawer */}
                  <Link
                    href="/user/deals"
                    onClick={() => onOpenChange(false)}
                    className="flex items-center justify-between p-3 rounded-xl border border-cyan-500/30 bg-cyan-50/80 dark:bg-cyan-950/25 mb-2 hover:bg-cyan-100/60 dark:hover:bg-cyan-950/40 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-500/40 text-cyan-600 dark:text-cyan-400">
                        <Lock className="size-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Két Giữ Tiền An Toàn
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-cyan-700 dark:text-cyan-300">
                      {lockedBalanceVND.toLocaleString("vi-VN")} ₫
                    </span>
                  </Link>

                  {/* Menu điều hướng cá nhân */}
                  {AUTH_NAV_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => onOpenChange(false)}
                      className={cn(
                        "text-sm font-medium transition-colors py-2.5 px-3 rounded-xl min-h-11 flex items-center",
                        pathname === item.href
                          ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 font-semibold"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}

                  {/* Nút Tạo Giao Dịch trong Drawer */}
                  <Link
                    href="/user/deals/create"
                    onClick={() => onOpenChange(false)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold min-h-12 px-4 text-sm shadow-[0_0_15px_rgba(16,185,129,0.25)] mt-2"
                  >
                    <PlusCircle className="size-4" />
                    <span>+ Tạo Giao Dịch</span>
                  </Link>

                  {/* Cài đặt tài khoản & STK VietQR */}
                  <Link
                    href="/user/settings"
                    onClick={() => onOpenChange(false)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 min-h-11 px-4 text-xs font-semibold mt-1"
                  >
                    <Settings className="size-4 text-cyan-600 dark:text-cyan-400" />
                    <span>Cài đặt & Ví rút VietQR</span>
                  </Link>
                </>
              ) : (
                <>
                  {/* Public Links cho Guest */}
                  {GUEST_NAV_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => onOpenChange(false)}
                      className={cn(
                        "text-sm font-medium transition-colors py-2.5 px-3 rounded-xl min-h-11 flex items-center",
                        pathname === item.href
                          ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 font-semibold"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Footer Section của Drawer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 pb-2 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Giao diện sáng/tối</span>
              <ThemeToggle />
            </div>

            {isAuth ? (
              <Button
                variant="ghost"
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 min-h-11 rounded-xl text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold text-xs cursor-pointer"
              >
                <LogOut className="size-4" />
                <span>Đăng xuất tài khoản</span>
              </Button>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-11 text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <KeyRound className="size-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Đăng nhập</span>
                </Link>
                <Link
                  href="/register"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-linear-to-r from-emerald-500 to-cyan-500 min-h-11 text-xs font-bold text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                >
                  <span>Đăng ký</span>
                </Link>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
