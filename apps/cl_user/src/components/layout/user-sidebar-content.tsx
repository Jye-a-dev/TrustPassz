"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Cpu,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { SidebarVaultCard } from "./sidebar-vault-card";
import { SidebarTelemetryBadge } from "./sidebar-telemetry-badge";
import { BASE_NAV_ITEMS, isRouteActive, type NavItem } from "./user-sidebar-nav-items";

interface UserSidebarContentProps {
  onNavigate?: () => void;
  lockedBalanceVND?: number;
  activeCount?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function UserSidebarContent({
  onNavigate,
  lockedBalanceVND = 0,
  activeCount: propActiveCount,
  isCollapsed = false,
  onToggleCollapse,
}: UserSidebarContentProps) {
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
          apiClient<
            | { data?: Array<{ state: string; amount: string | number }> }
            | Array<{ state: string; amount: string | number }>
          >("/api/v1/deals?limit=50"),
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
          badge: `${activeCount} Kèo`,
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
    <div
      className={cn(
        "flex h-full flex-col justify-between transition-all duration-300",
        isCollapsed ? "p-2 items-center" : "p-4 space-y-6"
      )}
    >
      <div className={cn("w-full", isCollapsed ? "space-y-4" : "space-y-5")}>
        {!isCollapsed && <SidebarTelemetryBadge />}

        <div className="space-y-1 w-full">
          {!isCollapsed && (
            <div className="px-3 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                DANH MỤC ĐIỀU HÀNH
              </span>
              <span className="text-[10px] font-mono text-rose-500 font-bold">2.0</span>
            </div>
          )}

          <nav
            className={cn("space-y-1.5", !isCollapsed && "mt-2")}
            aria-label="Sidebar navigation"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isRouteActive(pathname, item.href);

              if (isCollapsed) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    title={item.label}
                    className={cn(
                      "group relative flex min-h-[44px] min-w-[44px] size-11 items-center justify-center rounded-xl transition-all mx-auto border",
                      isActive
                        ? "bg-rose-500 text-white border-rose-600 shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:bg-rose-50/70 hover:text-rose-600 dark:hover:bg-slate-800 border-transparent hover:border-rose-100"
                    )}
                  >
                    <Icon className="size-5 shrink-0" />
                    {item.badge && activeCount > 0 && (
                      <span className="absolute top-1 right-1 size-2 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900" />
                    )}
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group relative flex min-h-[44px] items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all border",
                    isActive
                      ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 font-bold border-rose-200 dark:border-rose-900 border-r-2 border-r-rose-500 shadow-2xs"
                      : "text-slate-600 dark:text-slate-300 hover:bg-rose-50/70 hover:text-rose-600 dark:hover:bg-slate-800 border-transparent hover:border-rose-100"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        "size-4 transition-colors shrink-0",
                        isActive
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-slate-400 group-hover:text-rose-500"
                      )}
                    />
                    <span className="truncate">{item.label}</span>
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

        {!isCollapsed && (
          <SidebarVaultCard
            displayLockedBalance={displayLockedBalance}
            onNavigate={onNavigate}
          />
        )}
      </div>

      <div className="w-full space-y-3 pb-2">
        {onToggleCollapse && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
            className={cn(
              "w-full min-h-[44px] flex items-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer",
              isCollapsed ? "justify-center p-0" : "justify-between px-3"
            )}
          >
            <div className="flex items-center gap-2">
              {isCollapsed ? (
                <PanelLeftOpen className="size-4.5 text-slate-600 dark:text-slate-300" />
              ) : (
                <>
                  <PanelLeftClose className="size-4 text-slate-600 dark:text-slate-300" />
                  <span className="text-xs font-semibold">Thu gọn thanh bên</span>
                </>
              )}
            </div>
            {!isCollapsed && (
              <span className="text-[10px] font-mono text-slate-400">Ctrl+[</span>
            )}
          </Button>
        )}

        {!isCollapsed && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3 space-y-1 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">
              <Cpu className="size-3 text-emerald-600" />
              <span>Kho lưu trữ bảo mật</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
              Tài liệu và mật khẩu được mã hóa AES-256, chỉ bàn giao khi thanh toán hoàn tất.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
