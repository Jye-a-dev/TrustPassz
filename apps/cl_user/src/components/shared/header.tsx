"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  PlusCircle,
  KeyRound,
  Menu,
  User,
  LogOut,
  Settings,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";

const NAV_ITEMS = [
  { label: "Khám phá Giao dịch", href: "/explore" },
  { label: "Bàn Đàm Phán Demo", href: "/deals/demo" },
  { label: "Đơn hàng", href: "/orders" },
  { label: "Dashboard", href: "/dashboard" },
];

export function Header() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500/20 via-cyan-500/20 to-emerald-500/10 border border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)] group-hover:border-cyan-400/60 transition-all">
              <ShieldCheck className="size-5 text-emerald-400 group-hover:text-cyan-300 transition-colors" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                TrustPassz
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/90 leading-none">
                Két Giao Dịch Escrow
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-cyan-300 text-xs sm:text-sm py-1.5",
                  pathname === item.href
                    ? "text-cyan-400 font-semibold"
                    : "text-slate-300"
                )}
              >
                {item.label}
              </Link>
            ))}

            <Link
              href="/deals/create"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                "bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              )}
            >
              <PlusCircle className="size-3.5 text-emerald-400" />
              <span>Tạo Kèo Mới</span>
            </Link>
          </nav>
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Network Badge: Base Sepolia */}
          <Badge
            variant="outline"
            className="hidden lg:inline-flex items-center gap-1.5 rounded-full border-slate-700 bg-slate-900/80 px-2.5 py-1 text-[11px] font-medium text-slate-300"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span>Base Sepolia</span>
          </Badge>

          {/* Auth State Button */}
          {mounted && isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-9 px-3 rounded-lg border-slate-700 bg-slate-900/80 text-cyan-300 hover:bg-slate-800 text-xs font-semibold gap-1.5"
              >
                <Link href="/settings">
                  <User className="size-3.5" />
                  <span className="max-w-25 truncate">
                    {user.displayName || user.email?.split("@")[0] || "User"}
                  </span>
                </Link>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => logout()}
                className="h-9 w-9 p-0 text-slate-400 hover:text-rose-400"
                title="Đăng xuất"
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-9 px-3 rounded-lg border-slate-700 bg-slate-900/60 hover:bg-slate-800 hover:border-cyan-500/40 text-slate-100 hover:text-white text-xs font-semibold gap-1.5"
              >
                <Link href="/login">
                  <KeyRound className="size-3.5 text-cyan-400" />
                  <span>Đăng nhập</span>
                </Link>
              </Button>

              <Button
                asChild
                size="sm"
                className="hidden sm:inline-flex h-9 px-3 rounded-lg bg-linear-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs"
              >
                <Link href="/register">
                  <span>Đăng ký</span>
                </Link>
              </Button>
            </div>
          )}

          {/* Theme Toggle */}
          <div className="flex items-center">
            <ThemeToggle />
          </div>

          {/* Mobile Sheet Trigger */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="min-h-11 min-w-11 text-slate-300 hover:text-white"
                  aria-label="Mở menu điều hướng"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="bg-slate-950 border-slate-800 text-slate-100 w-72"
              >
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2.5 text-left">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                      <ShieldCheck className="size-4.5" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-base leading-tight">
                        TrustPassz
                      </div>
                      <div className="text-[10px] text-emerald-400 uppercase tracking-wider">
                        Két Giao Dịch Escrow
                      </div>
                    </div>
                  </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col gap-3 mt-6">
                  {/* Network Indicator in Mobile Drawer */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                    <span className="text-slate-400">Trạng thái mạng:</span>
                    <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                      <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                      Base Sepolia
                    </span>
                  </div>

                  {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "text-sm font-medium transition-colors py-2.5 px-3 rounded-lg min-h-11 flex items-center",
                        pathname === item.href
                          ? "bg-cyan-500/10 text-cyan-300 font-semibold"
                          : "text-slate-300 hover:bg-slate-900 hover:text-white"
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}

                  <Link
                    href="/deals/create"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold min-h-11 px-4 text-sm shadow-[0_0_15px_rgba(16,185,129,0.3)] mt-2"
                  >
                    <PlusCircle className="size-4" />
                    <span>Tạo Giao Dịch Ký Quỹ</span>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-850 text-slate-200 min-h-11 px-4 text-xs font-semibold mt-1"
                  >
                    <Settings className="size-4 text-cyan-400" />
                    <span>Cấu hình Ví & Tài khoản</span>
                  </Link>

                  <div className="pt-2 border-t border-slate-800 flex gap-2">
                    <Link
                      href="/login"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 py-2 text-xs font-semibold text-slate-200"
                    >
                      <KeyRound className="size-3.5 text-cyan-400" />
                      <span>Đăng nhập</span>
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setIsOpen(false)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 py-2 text-xs font-bold text-slate-950"
                    >
                      <span>Đăng ký</span>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
