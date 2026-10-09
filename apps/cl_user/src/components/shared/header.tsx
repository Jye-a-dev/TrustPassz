"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useAuthStore } from "@/lib/auth-store";
import { apiClient } from "@/lib/api-client";
import { supabase } from "@/lib/supabase-client";
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

  // Realtime Escrow Locked Balance ("Két Giữ Tiền")
  const [lockedBalanceVND, setLockedBalanceVND] = React.useState<number>(0);

  React.useEffect(() => {
    if (!isAuth) return;
    let isMounted = true;

    async function fetchLockedBalance() {
      try {
        const dealsRes = await apiClient<
          | { data?: Array<{ state: string; amount: string | number }> }
          | Array<{ state: string; amount: string | number }>
        >("/api/v1/deals?limit=50");

        if (!isMounted) return;
        const val = dealsRes;
        const items = Array.isArray(val) ? val : Array.isArray(val?.data) ? val.data : [];
        const locked = items
          .filter((d) => d.state === "DEPOSITED" || d.state === "IN_INSPECTION")
          .reduce((sum, d) => sum + Number(d.amount || 0), 0);
        setLockedBalanceVND(locked);
      } catch {
        // Fallback silently
      }
    }

    void fetchLockedBalance();

    const channel = supabase
      .channel("public:deals-header-main")
      .on(
        "postgres_changes" as never,
        { event: "*", schema: "public", table: "deals" },
        () => {
          void fetchLockedBalance();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [isAuth, pathname, user?.id]);

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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md transition-colors duration-150">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Desktop Nav Links */}
        <div className="flex items-center gap-3 lg:gap-6 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500/10 dark:from-emerald-500/20 via-cyan-500/10 dark:via-cyan-500/20 to-emerald-500/5 dark:to-emerald-500/10 border border-emerald-500/30 dark:border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)] dark:shadow-[0_0_15px_rgba(16,185,129,0.25)] group-hover:border-cyan-500/60 transition-all shrink-0 p-1">
              <Image src="/logo.png" alt="TrustPassz" width={28} height={28} priority className="size-7 object-contain" />
            </div>
            <div className="flex flex-col shrink-0">
              <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors whitespace-nowrap">
                TrustPassz
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400/90 leading-none whitespace-nowrap">
                Bảo Vệ Giao Dịch An Toàn
              </span>
            </div>
          </Link>

          <HeaderNavLinks isAuth={isAuth} pathname={pathname} />
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Network Badge: Automated Protection */}

          {isAuth ? (
            <HeaderUserMenu
              user={user}
              displayName={displayName}
              userInitials={userInitials}
              formattedWallet={formattedWallet}
              onLogout={handleLogout}
              lockedBalanceVND={lockedBalanceVND}
            />
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-9 px-3 sm:px-3.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-cyan-500/40 text-slate-700 dark:text-slate-100 hover:text-slate-950 dark:hover:text-white text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <Link href="/login">
                  <KeyRound className="size-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Đăng nhập</span>
                </Link>
              </Button>

              <Button
                asChild
                size="sm"
                className="h-9 px-3 sm:px-3.5 rounded-xl bg-linear-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.25)] border-0 cursor-pointer"
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
            lockedBalanceVND={lockedBalanceVND}
          />
        </div>
      </div>
    </header>
  );
}
