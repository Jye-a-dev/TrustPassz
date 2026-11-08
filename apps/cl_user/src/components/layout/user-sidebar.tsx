"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Handshake,
  PlusCircle,
  Receipt,
  Scale,
  Settings,
  Shield,
  Cpu,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { apiClient } from "@/lib/api-client";
import { SidebarVaultCard } from "./sidebar-vault-card";
import { SidebarTelemetryBadge } from "./sidebar-telemetry-badge";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  isAction?: boolean;
  badge?: string;
  badgeColor?: string;
}

export function isRouteActive(currentPath: string, targetHref: string): boolean {
  if (targetHref === "/user") {
    return currentPath === "/user";
  }
  if (targetHref === "/user/deals") {
    return (
      currentPath === "/user/deals" ||
      (currentPath.startsWith("/user/deals/") && currentPath !== "/user/deals/create")
    );
  }
  if (targetHref === "/user/deals/create") {
    return currentPath === "/user/deals/create";
  }
  return currentPath === targetHref || currentPath.startsWith(targetHref + "/");
}

export const BASE_NAV_ITEMS: Omit<NavItem, "badge" | "badgeColor">[] = [
  {
    label: "Bàn Điều Hành",
    href: "/user",
    icon: LayoutDashboard,
  },
  {
    label: "Giao Dịch Của Tôi",
    href: "/user/deals",
    icon: Handshake,
  },
  {
    label: "Tạo Giao Dịch Mới",
    href: "/user/deals/create",
    icon: PlusCircle,
    isAction: true,
  },
  {
    label: "Lịch Sử Đơn & Biên Lai",
    href: "/user/orders",
    icon: Receipt,
  },
  {
    label: "Báo Lỗi & Khiếu Nại",
    href: "/user/disputes",
    icon: Scale,
  },
  {
    label: "Cài Đặt & STK VietQR",
    href: "/user/settings",
    icon: Settings,
  },
];

interface UserSidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  lockedBalanceVND?: number;
  activeCount?: number;
}

export function UserSidebarContent({
  onNavigate,
  lockedBalanceVND = 0,
  activeCount: propActiveCount,
}: {
  onNavigate?: () => void;
  lockedBalanceVND?: number;
  activeCount?: number;
}) {
  const pathname = usePathname();
  const [localActiveCount, setLocalActiveCount] = React.useState<number>(propActiveCount ?? 0);
  const [localLockedBalance, setLocalLockedBalance] = React.useState<number>(lockedBalanceVND ?? 0);

  React.useEffect(() => {
    if (propActiveCount !== undefined) return;

    let isMounted = true;
    async function loadStats() {
      try {
        const [countRes, dealsRes] = await Promise.allSettled([
          apiClient<{ total: number; breakdown?: Record<string, number> }>("/api/v1/deals/count"),
          apiClient<{ data?: Array<{ state: string; amount: string | number }> } | Array<{ state: string; amount: string | number }>>("/api/v1/deals?limit=50"),
        ]);

        if (!isMounted) return;

        if (countRes.status === "fulfilled" && countRes.value?.breakdown) {
          const b = countRes.value.breakdown;
          const active =
            (b.PENDING || 0) +
            (b.DEPOSITED || 0) +
            (b.IN_INSPECTION || 0) +
            (b.DISPUTED || 0);
          setLocalActiveCount(active);
        }

        if (dealsRes.status === "fulfilled") {
          const val = dealsRes.value;
          const items = Array.isArray(val) ? val : Array.isArray(val?.data) ? val.data : [];
          const locked = items
            .filter((d) => d.state === "DEPOSITED" || d.state === "IN_INSPECTION")
            .reduce((sum, d) => sum + Number(d.amount || 0), 0);
          setLocalLockedBalance(locked);
        }
      } catch {
        // Fallback silently
      }
    }

    void loadStats();

    return () => {
      isMounted = false;
    };
  }, [pathname, propActiveCount]);

  const activeCount = propActiveCount ?? localActiveCount;
  const displayLockedBalance = lockedBalanceVND || localLockedBalance;

  const navItems: NavItem[] = React.useMemo(() => {
    return BASE_NAV_ITEMS.map((item) => {
      if (item.href === "/user/deals") {
        return {
          ...item,
          badge: `${activeCount} Đơn`,
          badgeColor:
            activeCount > 0
              ? "bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs"
              : "bg-slate-100 text-slate-500 border border-slate-200",
        };
      }
      return item;
    });
  }, [activeCount]);

  return (
    <div className="flex h-full flex-col justify-between p-4 space-y-6">
      <div className="space-y-5">
        <SidebarTelemetryBadge />

        {/* Navigation Section */}
        <div className="space-y-1">
          <div className="px-3 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              DANH MỤC QUẢN LÝ
            </span>
            <span className="text-[10px] font-mono text-rose-500 font-bold">2.0</span>
          </div>

          <nav className="mt-2 space-y-1" aria-label="Sidebar navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isRouteActive(pathname, item.href);

              if (item.isAction) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex min-h-11 items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all my-2 overflow-hidden",
                      isActive
                        ? "bg-rose-600 text-white border border-rose-700 shadow-sm font-bold"
                        : "bg-rose-500 hover:bg-rose-600 border border-rose-600 text-white shadow-sm"
                    )}
                  >
                    <div className="flex items-center gap-2.5 z-10">
                      <div className="p-1.5 rounded-lg bg-white/20 text-white">
                        <Icon className="size-3.5" />
                      </div>
                      <span className="tracking-tight text-white font-bold">{item.label}</span>
                    </div>

                    <span className="rounded-full px-2 py-0.5 text-[9px] font-mono font-bold z-10 bg-white/20 text-white border border-white/30">
                      MỚI
                    </span>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group relative flex min-h-11 items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all border",
                    isActive
                      ? "bg-rose-50 text-rose-600 font-bold border-rose-200 border-r-2 border-r-rose-500 shadow-2xs"
                      : "text-slate-600 hover:bg-rose-50/70 hover:text-rose-600 border-transparent hover:border-rose-100"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        "size-4 transition-colors",
                        isActive
                          ? "text-rose-600"
                          : "text-slate-400 group-hover:text-rose-500"
                      )}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge ? (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold font-mono transition-colors",
                        item.badgeColor || "bg-slate-100 text-slate-600"
                      )}
                    >
                      {item.badge}
                    </span>
                  ) : (
                    <ChevronRight
                      className={cn(
                        "size-3.5 transition-transform opacity-0 group-hover:opacity-100 text-slate-400",
                        isActive && "opacity-100 text-rose-500"
                      )}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Visual Escrow Vault Metric Card */}
        <SidebarVaultCard
          displayLockedBalance={displayLockedBalance}
          onNavigate={onNavigate}
        />
      </div>

      {/* Hardware Enclave Security Stamp */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1 text-center mb-6">
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-emerald-700 font-bold uppercase tracking-wider">
          <Cpu className="size-3 text-emerald-600" />
          <span>Kho lưu trữ bảo mật</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-tight">
          Tài liệu và mật khẩu được mã hóa AES-256, chỉ bàn giao cho người mua khi thanh toán xong.
        </p>
      </div>
    </div>
  );
}

export function UserSidebar({
  isOpenMobile,
  onCloseMobile,
  lockedBalanceVND = 0,
  activeCount,
}: UserSidebarProps) {
  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-40 border-r border-slate-200 bg-white shadow-xs">
        <div className="flex h-16 items-center px-6 border-b border-slate-200 justify-between">
          <Link
            href="/user"
            className="flex items-center gap-2.5 transition-transform hover:scale-[1.02]"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-rose-50 border border-rose-200 text-rose-500 shadow-sm p-1">
              <Shield className="size-5 text-rose-500" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900">
                  TrustPassz
                </span>
                <span className="rounded bg-rose-50 border border-rose-200 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-rose-600">
                  AN TOÀN
                </span>
              </div>
              <span className="text-[10px] font-medium text-slate-400 leading-none">
                SÀN KÝ QUỸ AN TOÀN
              </span>
            </div>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pb-6">
          <UserSidebarContent
            lockedBalanceVND={lockedBalanceVND}
            activeCount={activeCount}
          />
        </div>
      </aside>

      {/* Mobile Drawer (Sheet) */}
      <Sheet open={isOpenMobile} onOpenChange={onCloseMobile}>
        <SheetContent
          side="left"
          className="bg-white border-slate-200 text-slate-800 p-0 w-72"
        >
          <SheetHeader className="p-4 border-b border-slate-200 text-left">
            <SheetTitle className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-rose-50 border border-rose-200 text-rose-500">
                <Shield className="size-4.5" />
              </div>
              <div>
                <span className="font-extrabold text-base text-slate-900 tracking-tight">
                  TrustPassz
                </span>
                <span className="block text-[10px] font-semibold text-rose-600 uppercase tracking-wider">
                  SÀN KÝ QUỸ AN TOÀN
                </span>
              </div>
            </SheetTitle>
          </SheetHeader>

          <div className="h-[calc(100vh-65px)] overflow-y-auto pb-6">
            <UserSidebarContent
              onNavigate={onCloseMobile}
              lockedBalanceVND={lockedBalanceVND}
              activeCount={activeCount}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
