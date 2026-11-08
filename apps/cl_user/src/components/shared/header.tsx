"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { KeyRound, ShoppingBag, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { SubNavbar } from "@/components/layout/sub-navbar";
import { useAuthStore } from "@/lib/auth-store";
import { apiClient } from "@/lib/api-client";
import { supabase } from "@/lib/supabase-client";
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
    <header className="sticky top-0 z-40 w-full flex flex-col">
      {/* Tầng 1 - Top Navbar */}
      <div className="w-full bg-canvas/95 backdrop-blur-md border-b border-subtle shadow-xs transition-colors duration-150">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3 lg:gap-6">
            {/* Left: Brand Logo & Category Shortcut */}
            <div className="flex items-center gap-3 lg:gap-4 shrink-0">
              <Link href="/" className="flex items-center gap-2.5 group shrink-0">
                <div className="w-9 h-9 rounded-xl bg-brand-pink-tint border border-brand-pink/30 flex items-center justify-center text-brand-pink shadow-sm group-hover:scale-105 transition-transform p-1">
                  <Image src="/logo.png" alt="TrustPassz" width={28} height={28} priority className="size-6 object-contain" />
                </div>
                <div className="flex flex-col shrink-0">
                  <span className="text-lg font-bold text-primary tracking-tight leading-none group-hover:text-brand-pink transition-colors">
                    TrustPassz
                  </span>
                  <span className="text-[10px] text-muted font-medium tracking-wide mt-0.5">
                    SÀN KÝ QUỸ AN TOÀN
                  </span>
                </div>
              </Link>

              <Link
                href="/explore"
                className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-secondary bg-surface hover:bg-input-bg border border-strong hover:border-brand-pink/50 shadow-sm active:translate-y-0.5 transition-all shrink-0"
              >
                <span>Danh mục</span>
              </Link>
            </div>

            {/* Right: User Actions Cluster */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {isAuth ? (
                <>
                  <Link
                    href="/user/orders"
                    className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-strong bg-surface hover:bg-input-bg text-secondary hover:text-primary text-xs font-semibold shadow-sm active:translate-y-0.5 transition-all shrink-0"
                    title="Quản lý đơn hàng"
                  >
                    <ShoppingBag className="size-4 text-muted" />
                    <span>Đơn hàng</span>
                  </Link>

                  <Link
                    href="/user/deals/create"
                    className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-brand-pink hover:bg-brand-pink-hover text-white font-semibold text-xs sm:text-sm border border-brand-pink shadow-sm active:translate-y-0.5 transition-all shrink-0"
                  >
                    <Plus className="size-4" />
                    <span>Đăng bán / Tạo kèo</span>
                  </Link>

                  <HeaderUserMenu
                    user={user}
                    displayName={displayName}
                    userInitials={userInitials}
                    formattedWallet={formattedWallet}
                    onLogout={handleLogout}
                    lockedBalanceVND={lockedBalanceVND}
                  />
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="min-h-10 px-3.5 rounded-xl border border-strong bg-surface hover:bg-input-bg text-primary text-xs font-semibold gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Link href="/login">
                      <KeyRound className="size-3.5 text-muted" />
                      <span>Đăng nhập</span>
                    </Link>
                  </Button>

                  <Button
                    asChild
                    size="sm"
                    className="min-h-10 px-4 rounded-xl bg-brand-pink hover:bg-brand-pink-hover text-white font-semibold text-xs border border-brand-pink shadow-sm cursor-pointer"
                  >
                    <Link href="/register">
                      <span>Đăng ký</span>
                    </Link>
                  </Button>
                </div>
              )}

              {/* Theme Toggle Button */}
              <div className="hidden sm:flex items-center">
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
        </div>
      </div>

      {/* Tầng 2 - Sub-Navbar (Global Search Bar & Quick Categories) */}
      <SubNavbar />
    </header>
  );
}
