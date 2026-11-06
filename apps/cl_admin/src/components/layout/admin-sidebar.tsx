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
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Tổng quan điều hành",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Phân tích & Thống kê",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    label: "Kèo & Escrow State",
    href: "/deals",
    icon: Scale,
  },
  {
    label: "Hàng đợi tranh chấp",
    href: "/disputes",
    icon: ShieldAlert,
    badge: "AI Queue",
  },
  {
    label: "Kiểm định AI Lab",
    href: "/ai-lab",
    icon: Bot,
  },
  {
    label: "5 Trụ cột Hệ thống",
    href: "/system-status",
    icon: Activity,
  },
  {
    label: "Người dùng & RBAC",
    href: "/users",
    icon: Users,
  },
  {
    label: "Hồ sơ & Bảo mật",
    href: "/admin/profile",
    icon: UserCog,
  },
  {
    label: "Cảnh báo Khẩn cấp",
    href: "/admin/settings/emergency-alerts",
    icon: BellRing,
    badge: "2FA",
  },
  {
    label: "Super API Explorer",
    href: "/api-explorer",
    icon: Terminal,
  },
];

const STORAGE_KEY = "tpz_admin_sidebar_collapsed";

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);

  // Sync state with localStorage to prevent hydration layout flicker
  React.useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setCollapsed(stored === "true");
      }
    } catch {
      // Safe fallback if localStorage is blocked
    }
  }, []);

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
          "hidden lg:flex relative flex-col border-r border-slate-800 bg-cyber-surface transition-all duration-300 select-none z-30 shrink-0",
          collapsed ? "w-16" : "w-65"
        )}
      >
        {/* Sidebar Header & Toggle */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-3.5">
          {!collapsed && (
            <div className="flex items-center space-x-2 animate-in fade-in-0 duration-200">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                Admin Portal
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Mở rộng sidebar điều hướng" : "Thu gọn sidebar điều hướng"}
            className={cn(
              "size-11 min-h-11 min-w-11 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors",
              collapsed ? "mx-auto" : "ml-auto"
            )}
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </Button>
        </div>

        {/* Nav List */}
        <nav className="flex-1 space-y-1.5 p-2.5 overflow-y-auto scrollbar-none">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            const navLink = (
              <Link
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 min-h-11",
                  isActive
                    ? "bg-cyan-950/40 text-cyan-400 border border-cyan-800/50 font-semibold shadow-[0_0_12px_rgba(6,182,212,0.12)]"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-cyan-400 shadow-[0_0_8px_#06B6D4]" />
                )}
                <Icon
                  className={cn(
                    "size-5 shrink-0 transition-colors",
                    isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-slate-200"
                  )}
                />
                {!collapsed && (
                  <span className="flex-1 truncate tracking-tight text-xs font-sans">
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

            if (collapsed && isMounted) {
              return (
                <Tooltip key={item.href} delayDuration={100}>
                  <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                  <TooltipContent side="right" className="font-sans font-medium">
                    {item.label}
                    {item.badge && ` (${item.badge})`}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <React.Fragment key={item.href}>{navLink}</React.Fragment>;
          })}
        </nav>

        {/* Footer Info */}
        <div className="border-t border-slate-800 p-3 bg-cyber-bg/50">
          {!collapsed ? (
            <div className="rounded-lg border border-slate-800/80 bg-cyber-surface p-2.5 text-[11px] text-slate-400">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-semibold">TrustPassz Core</span>
                <span className="font-mono text-emerald-400 text-[10px]">v1.2.0</span>
              </div>
              <p className="mt-1 text-[10px] text-slate-500 font-mono">
                Base Sepolia & AI Arbitrator
              </p>
            </div>
          ) : (
            <div className="flex justify-center py-1">
              <ShieldCheck className="size-5 text-slate-500" />
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
