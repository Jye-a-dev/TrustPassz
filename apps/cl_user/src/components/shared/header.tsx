"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShieldCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useAuthStore } from "@/lib/auth-store";
import { HeaderNavLinks } from "./header-nav-links";
import { HeaderUserMenu } from "./header-user-menu";
import { HeaderMobileDrawer } from "./header-mobile-drawer";

const emptySubscribe = () => () => {};

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);

  // useSyncExternalStore ngăn chặn triệt để Hydration Mismatch & không gây cascading render trong React 19
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Đọc state từ Zustand persist store
  const { user, isAuthenticated, logout } = useAuthStore();
  const isAuth = mounted && isAuthenticated && !!user;

  // Header công khai tự ẩn khi người dùng đã bước vào /user workspace (đã có UserNavbar/UserSidebar riêng)
  if (pathname?.startsWith("/user")) {
    return null;
  }

  const handleLogout = async () => {
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        (typeof window !== "undefined"
          ? `${window.location.protocol}//${window.location.hostname}:3000`
          : "http://localhost:3000");

      await fetch(`${apiUrl}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
      }).catch(() => null);

      document.cookie =
        "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      logout();
      setIsOpen(false);
      router.push("/");
      router.refresh();
    }
  };

  const displayName =
    user?.displayName || user?.email?.split("@")[0] || "Thành viên";
  const userInitials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const formattedWallet = user?.walletAddress
    ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
    : "0x8B...3a29";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
        {/* Brand Logo & Desktop Nav Links */}
        <div className="flex items-center gap-4 lg:gap-6 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500/20 via-cyan-500/20 to-emerald-500/10 border border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)] group-hover:border-cyan-400/60 transition-all shrink-0">
              <ShieldCheck className="size-5 text-emerald-400 group-hover:text-cyan-300 transition-colors" />
            </div>
            <div className="flex flex-col shrink-0">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white group-hover:text-cyan-300 transition-colors whitespace-nowrap">
                TrustPassz
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/90 leading-none whitespace-nowrap">
                Bảo Vệ Giao Dịch An Toàn
              </span>
            </div>
          </Link>

          <HeaderNavLinks isAuth={isAuth} pathname={pathname} />
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Network Badge: Automated Protection */}
          <Badge
            variant="outline"
            className="hidden xl:inline-flex items-center gap-1.5 rounded-full border-slate-700 bg-slate-900/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 whitespace-nowrap shrink-0"
          >
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span className="whitespace-nowrap">Hệ thống bảo vệ tự động</span>
          </Badge>

          {isAuth ? (
            <HeaderUserMenu
              user={user}
              displayName={displayName}
              userInitials={userInitials}
              formattedWallet={formattedWallet}
              onLogout={handleLogout}
            />
          ) : (
            <div className="flex items-center gap-2">
              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-9 px-3.5 rounded-lg border-slate-700 bg-slate-900/60 hover:bg-slate-800 hover:border-cyan-500/40 text-slate-100 hover:text-white text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <Link href="/login">
                  <KeyRound className="size-3.5 text-cyan-400" />
                  <span>Đăng nhập</span>
                </Link>
              </Button>

              <Button
                asChild
                size="sm"
                className="h-9 px-3.5 rounded-lg bg-linear-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.25)] border-0 cursor-pointer"
              >
                <Link href="/register">
                  <span>Đăng ký</span>
                </Link>
              </Button>
            </div>
          )}

          {/* Theme Toggle Button */}
          <div className="flex items-center">
            <ThemeToggle />
          </div>

          {/* Mobile Drawer */}
          <HeaderMobileDrawer
            isOpen={isOpen}
            onOpenChange={setIsOpen}
            isAuth={isAuth}
            displayName={displayName}
            userInitials={userInitials}
            formattedWallet={formattedWallet}
            pathname={pathname}
            onLogout={handleLogout}
          />
        </div>
      </div>
    </header>
  );
}
