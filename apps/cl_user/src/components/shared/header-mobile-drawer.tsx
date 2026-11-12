"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck as _ShieldCheck,
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
            variant="outline"
            size="icon"
            className="size-9 rounded-xl border border-strong bg-surface hover:bg-input-bg text-primary shadow-sm cursor-pointer"
            aria-label="Mở menu điều hướng"
          >
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="bg-surface border-subtle text-primary w-80 max-w-[85vw] flex flex-col justify-between p-6 shadow-2xl"
        >
          <div className="overflow-y-auto pr-1">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2.5 text-left">
                <div className="w-9 h-9 rounded-xl bg-brand-pink-tint border border-brand-pink/30 flex items-center justify-center text-brand-pink shadow-sm p-1">
                  <Image src="/logo.png" alt="TrustPassz" width={28} height={28} className="size-6 object-contain" />
                </div>
                <div>
                  <div className="font-extrabold text-primary text-base leading-tight">
                    TrustPassz
                  </div>
                  <div className="text-[10px] text-muted uppercase tracking-wider font-semibold">
                    SÀN KÝ QUỸ AN TOÀN
                  </div>
                </div>
              </SheetTitle>
            </SheetHeader>

            <div className="flex flex-col gap-2.5 mt-6">
              {/* Network Status Badge */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-input-bg border border-subtle text-xs text-secondary mb-1">
                <span className="text-muted">Trạng thái bảo chứng:</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  Ký Quỹ VietQR
                </span>
              </div>

              {isAuth ? (
                <>
                  {/* Profile Info Card trong Drawer */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-input-bg border border-subtle mb-2">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-xs font-black text-white border border-rose-600 shadow-xs shrink-0">
                      {userInitials || "U"}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-primary truncate">
                        {displayName}
                      </span>
                      <span className="text-[11px] font-mono text-brand-pink truncate">
                        {formattedWallet}
                      </span>
                    </div>
                  </div>

                  {/* Két Giữ Tiền Widget trong Mobile Drawer */}
                  <Link
                    href="/user/deals"
                    onClick={() => onOpenChange(false)}
                    className="flex items-center justify-between p-3 rounded-xl border border-emerald-300 bg-emerald-50 mb-2 hover:bg-emerald-100/70 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-emerald-100 border border-emerald-300 text-emerald-700">
                        <Lock className="size-3.5" />
                      </div>
                      <span className="text-xs font-semibold text-emerald-900">
                        Két Giữ Tiền An Toàn
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-emerald-800">
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
                        "text-sm font-medium transition-colors py-2.5 px-3 rounded-xl min-h-11 flex items-center border",
                        pathname === item.href
                          ? "bg-brand-pink-tint border-brand-pink/30 text-brand-pink font-bold"
                          : "border-transparent text-secondary hover:bg-input-bg hover:text-primary"
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}

                  {/* Nút Tạo Giao Dịch trong Drawer */}
                  <Link
                    href="/user/deals/create"
                    onClick={() => onOpenChange(false)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-brand-pink hover:bg-brand-pink-hover text-white font-semibold min-h-12 px-4 text-sm border border-brand-pink shadow-sm mt-2 active:translate-y-0.5"
                  >
                    <PlusCircle className="size-4" />
                    <span>+ Đăng Bán / Tạo Kèo</span>
                  </Link>

                  {/* Cài đặt tài khoản & STK VietQR */}
                  <Link
                    href="/user/settings"
                    onClick={() => onOpenChange(false)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-strong bg-surface hover:bg-input-bg text-primary min-h-11 px-4 text-xs font-semibold mt-1 shadow-sm"
                  >
                    <Settings className="size-4 text-muted" />
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
                        "text-sm font-medium transition-colors py-2.5 px-3 rounded-xl min-h-11 flex items-center border",
                        pathname === item.href
                          ? "bg-brand-pink-tint border-brand-pink/30 text-brand-pink font-bold"
                          : "border-transparent text-secondary hover:bg-input-bg hover:text-primary"
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
          <div className="pt-4 border-t border-subtle pb-2 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-muted font-medium">Giao diện sáng/tối</span>
              <ThemeToggle />
            </div>

            {isAuth ? (
              <Button
                variant="outline"
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 min-h-11 rounded-xl text-brand-pink border border-brand-pink/30 hover:bg-brand-pink-tint/40 font-semibold text-xs cursor-pointer"
              >
                <LogOut className="size-4" />
                <span>Đăng xuất tài khoản</span>
              </Button>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-strong bg-surface hover:bg-input-bg min-h-11 text-xs font-semibold text-primary shadow-sm"
                >
                  <KeyRound className="size-3.5 text-muted" />
                  <span>Đăng nhập</span>
                </Link>
                <Link
                  href="/register"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-brand-pink hover:bg-brand-pink-hover border border-brand-pink min-h-11 text-xs font-bold text-white shadow-sm"
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
