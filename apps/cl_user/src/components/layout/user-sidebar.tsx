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
  Lock,
  ExternalLink,
  Shield,
  Cpu,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { apiClient } from "@/lib/api-client";

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
          badge: `${activeCount} Active`,
          badgeColor:
            activeCount > 0
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/35 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
              : "bg-slate-800/80 text-slate-400 border border-slate-700/50",
        };
      }
      return item;
    });
  }, [activeCount]);

  return (
    <div className="flex h-full flex-col justify-between p-4 space-y-6">
      <div className="space-y-5">
        {/* Node Telemetry Enclave Card */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 shadow-sm backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 size-16 bg-emerald-500/5 rounded-full blur-md pointer-events-none" />
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
              </span>
              HỆ THỐNG BẢO VỆ TỰ ĐỘNG
            </span>
            <span className="text-slate-400 font-mono text-[11px]">24/7</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Bảo vệ:</span>
            <span className="font-mono text-cyan-400 font-semibold bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20 text-[10px]">
              Tự Động &amp; An Toàn
            </span>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="space-y-1">
          <div className="px-3 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              {"// DANH MỤC QUẢN LÝ"}
            </span>
            <span className="text-[10px] font-mono text-cyan-400/80">v2.5</span>
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
                      "group relative flex min-h-11 items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all my-1.5 overflow-hidden",
                      isActive
                        ? "bg-linear-to-r from-emerald-500/20 via-slate-900/90 to-transparent border border-emerald-500/50 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.2)] font-bold"
                        : "bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-500/25 hover:border-emerald-500/40 text-emerald-300 hover:text-emerald-100"
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
                    )}

                    <div className="flex items-center gap-2.5 z-10">
                      <div
                        className={cn(
                          "p-1.5 rounded-lg transition-colors",
                          isActive
                            ? "bg-emerald-500/30 text-emerald-200 border border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                            : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 group-hover:bg-emerald-500/25"
                        )}
                      >
                        <Icon className="size-3.5" />
                      </div>
                      <span className="tracking-tight text-white font-bold">{item.label}</span>
                    </div>

                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[9px] font-mono font-bold z-10 transition-colors",
                        isActive
                          ? "bg-emerald-400/25 text-emerald-200 border border-emerald-400/60 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                          : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 group-hover:border-emerald-400/40"
                      )}
                    >
                      BẢO MẬT
                    </span>

                    <span className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full duration-700 transition-transform pointer-events-none" />
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group relative flex min-h-11 items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all",
                    isActive
                      ? "bg-linear-to-r from-cyan-500/15 via-slate-900/80 to-transparent border border-cyan-500/30 text-cyan-200 font-bold shadow-[0_0_20px_rgba(6,182,212,0.12)]"
                      : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-200 border border-transparent"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.9)]" />
                  )}

                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        "size-4 transition-colors",
                        isActive
                          ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                          : "text-slate-400 group-hover:text-slate-300"
                      )}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge ? (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold font-mono transition-colors",
                        item.badgeColor || "bg-slate-800 text-slate-400"
                      )}
                    >
                      {item.badge}
                    </span>
                  ) : (
                    <ChevronRight
                      className={cn(
                        "size-3.5 transition-transform opacity-0 group-hover:opacity-100",
                        isActive && "opacity-100 text-cyan-400"
                      )}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Visual Escrow Vault Metric Card */}
        <div className="rounded-2xl border border-cyan-500/20 bg-linear-to-b from-[#090D16] via-[#070A10] to-[#04060A] p-4 space-y-3.5 shadow-xl relative overflow-hidden backdrop-blur-md group hover:border-cyan-500/35 transition-colors">
          <div className="absolute top-0 right-0 size-24 bg-cyan-500/8 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
                <Lock className="size-4 text-cyan-300" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block tracking-tight">
                  Két Giữ Tiền An Toàn
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Kho bảo vệ tự động
                </span>
              </div>
            </div>

            <span className="relative flex size-2">
              {displayLockedBalance > 0 ? (
                <>
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-cyan-400" />
                </>
              ) : (
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500/80" />
              )}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block font-mono">
              Tiền đang giữ an toàn
            </span>
            <div className="font-mono text-xl font-black text-cyan-300 tracking-tight flex items-baseline gap-1">
              <span>{displayLockedBalance.toLocaleString("vi-VN")}</span>
              <span className="text-xs font-normal text-slate-400">₫</span>
            </div>
          </div>

          {/* Mini Progress Status */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Bảo vệ tự động</span>
              <span className={displayLockedBalance > 0 ? "text-emerald-400 font-bold" : "text-slate-400 font-medium"}>
                {displayLockedBalance > 0 ? "Đang giữ an toàn" : "Sẵn sàng giao dịch"}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  displayLockedBalance > 0
                    ? "bg-linear-to-r from-cyan-500 to-emerald-400 w-full animate-pulse"
                    : "bg-slate-800 w-0"
                )}
              />
            </div>
          </div>

          <Link
            href="/user/deals"
            onClick={onNavigate}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-2.5 text-[11px] font-bold text-cyan-300 hover:bg-cyan-500/20 hover:text-white transition-all shadow-sm hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
          >
            <span>Quản Lý Giao Dịch</span>
            <ExternalLink className="size-3" />
          </Link>
        </div>
      </div>

      {/* Hardware Enclave Security Stamp (With clearance for floating elements) */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 space-y-1 text-center backdrop-blur-xs mb-6">
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
          <Cpu className="size-3 text-emerald-400" />
          <span>Kho lưu trữ bảo mật</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          Tài liệu và mật khẩu được khóa kín, chỉ gửi đúng cho người mua khi hoàn tất.
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
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-40 border-r border-slate-800/80 bg-[#070A10]/95 backdrop-blur-2xl">
        {/* Brand Header */}
        <div className="flex h-16 items-center px-6 border-b border-slate-800/80 justify-between">
          <Link
            href="/user"
            className="flex items-center gap-2.5 transition-transform hover:scale-[1.02]"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500/25 via-cyan-500/20 to-emerald-500/10 border border-emerald-500/50 text-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.25)]">
              <Shield className="size-5 text-emerald-400" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">
                  TrustPassz
                </span>
                <span className="rounded bg-cyan-950/80 border border-cyan-500/40 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-cyan-300">
                  SAFE
                </span>
              </div>
              <span className="text-[10px] font-medium text-slate-400 leading-none">
                Nền tảng giao dịch an toàn
              </span>
            </div>
          </Link>
        </div>

        {/* Scrollable Navigation */}
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
          className="bg-[#070A10] border-slate-800 text-slate-100 p-0 w-72"
        >
          <SheetHeader className="p-4 border-b border-slate-800 text-left">
            <SheetTitle className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                <Shield className="size-4.5" />
              </div>
              <div>
                <span className="font-extrabold text-base text-white tracking-tight">
                  TrustPassz
                </span>
                <span className="block text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
                  Bảo Vệ Giao Dịch An Toàn
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
