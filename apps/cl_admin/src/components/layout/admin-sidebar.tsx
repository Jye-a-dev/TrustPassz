"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Scale,
  ShieldAlert,
  Bot,
  Activity,
  Users,
  Terminal,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  BarChart3,
  UserCog,
  BellRing,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  category?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    category: "ĐIỀU HÀNH",
    label: "Tổng quan điều hành",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    category: "ĐIỀU HÀNH",
    label: "Phân tích & Thống kê",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    category: "ĐIỀU HÀNH",
    label: "Kèo & Escrow State",
    href: "/deals",
    icon: Scale,
  },
  {
    category: "TRỌNG TÀI & AI",
    label: "Hàng đợi tranh chấp",
    href: "/disputes",
    icon: ShieldAlert,
    badge: "AI Queue",
  },
  {
    category: "TRỌNG TÀI & AI",
    label: "Kiểm định AI Lab",
    href: "/ai-lab",
    icon: Bot,
  },
  {
    category: "HẠ TẦNG & BẢO MẬT",
    label: "5 Trụ cột Hệ thống",
    href: "/system-status",
    icon: Activity,
  },
  {
    category: "HẠ TẦNG & BẢO MẬT",
    label: "Người dùng & RBAC",
    href: "/users",
    icon: Users,
  },
  {
    category: "HẠ TẦNG & BẢO MẬT",
    label: "Quỹ Gas & Faucet",
    href: "/funding",
    icon: Coins,
  },
  {
    category: "HẠ TẦNG & BẢO MẬT",
    label: "Hồ sơ cá nhân",
    href: "/admin/profile",
    icon: UserCog,
  },
  {
    category: "HẠ TẦNG & BẢO MẬT",
    label: "Cảnh báo khẩn cấp",
    href: "/admin/settings/emergency-alerts",
    icon: BellRing,
    badge: "2FA",
  },
  {
    category: "HẠ TẦNG & BẢO MẬT",
    label: "Super API Explorer",
    href: "/api-explorer",
    icon: Terminal,
  },
];

const STORAGE_KEY = "tpz_admin_sidebar_collapsed";

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [isMounted] = React.useState(() =>
    typeof window !== "undefined",
  );

  const toggleCollapsed = () => {
    const nextState = !collapsed;
    setCollapsed(nextState);
    try {
      localStorage.setItem(STORAGE_KEY, String(nextState));
    } catch {
      // Ignore write errors
    }
  };

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "hidden lg:flex relative flex-col border-r border-slate-200 bg-white transition-all duration-300 select-none z-30 shrink-0",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Sidebar Header & Toggle */}
        <div className="flex h-14 items-center justify-between border-b border-slate-100 px-4">
          {!collapsed && (
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 animate-in fade-in-0 duration-200">
              <span className="size-1.5 rounded-full bg-slate-900" />
              Command Portal
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Mở rộng sidebar điều hướng" : "Thu gọn sidebar điều hướng"}
            className={cn(
              "size-7 min-h-7 min-w-7 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors",
              collapsed ? "mx-auto" : "ml-auto"
            )}
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </Button>
        </div>

        {/* Nav List with Category Headers */}
        <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto scrollbar-thin">
          {NAV_ITEMS.map((item, index) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            const isNewCategory =
              !collapsed &&
              (index === 0 || item.category !== NAV_ITEMS[index - 1].category);

            const navLink = (
              <Link
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg transition-colors min-h-10",
                  isActive
                    ? "bg-slate-100 text-slate-900 font-semibold border border-slate-200/80 shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon
                  className={cn(
                    "size-4.5 shrink-0 transition-colors",
                    isActive ? "text-slate-900" : "text-slate-400 group-hover:text-slate-600"
                  )}
                />
                {!collapsed && (
                  <span className="flex-1 truncate tracking-tight">
                    {item.label}
                  </span>
                )}
                {!collapsed && item.badge && (
                  <Badge variant="amber" className="text-[10px] py-0 px-1.5 font-mono">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );

            return (
              <React.Fragment key={item.href}>
                {isNewCategory && item.category && (
                  <div className={cn("pt-3 pb-1", index === 0 && "pt-1")}>
                    <p className="px-3 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                      {item.category}
                    </p>
                  </div>
                )}
                {collapsed && isMounted ? (
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                    <TooltipContent side="right" className="font-sans font-medium text-xs">
                      {item.label}
                      {item.badge && ` (${item.badge})`}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  navLink
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Footer Info */}
        <div className="border-t border-slate-200 p-3 bg-slate-50">
          {!collapsed ? (
            <div className="rounded-lg border border-slate-200 bg-white p-2.5 text-[11px] text-slate-500 shadow-2xs">
              <div className="flex items-center justify-between text-slate-700">
                <span className="font-semibold">TrustPassz Core</span>
                <span className="font-mono text-emerald-600 font-semibold text-[10px]">v2.4.0</span>
              </div>
              <p className="mt-0.5 text-[10px] text-slate-400 font-mono">
                Base Sepolia • Solana Devnet
              </p>
            </div>
          ) : (
            <div className="flex justify-center py-1">
              <ShieldCheck className="size-5 text-slate-400" />
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
