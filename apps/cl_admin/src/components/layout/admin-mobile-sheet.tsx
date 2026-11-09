"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  ShieldCheck,
  LayoutDashboard,
  Scale,
  ShieldAlert,
  Bot,
  Activity,
  Users,
  Terminal,
  ExternalLink,
  Fuel,
  LogOut,
  UserCog,
  BellRing,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CONTRACT_ADDRESS } from "@/lib/system-monitor";
import { useAdminAuthStore } from "@/lib/admin-auth-store";
import { cn } from "@/lib/utils";

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

interface AdminMobileSheetProps {
  relayerGasEth?: string;
}

export function AdminMobileSheet({ relayerGasEth = "0.4852" }: AdminMobileSheetProps) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const { user, logout } = useAdminAuthStore();

  const handleLinkClick = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Mở menu điều hướng"
          className="lg:hidden size-10 min-h-10 min-w-10 border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-75 sm:w-85 p-0 border-r border-slate-200 bg-white flex flex-col justify-between"
      >
        <div className="flex flex-col flex-1 overflow-y-auto scrollbar-thin">
          {/* Header */}
          <SheetHeader className="p-4 border-b border-slate-100 text-left bg-white">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs">
                <ShieldCheck className="size-4.5 text-white" />
              </div>
              <div>
                <SheetTitle className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                  TrustPassz <span className="text-slate-600 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono">ADMIN</span>
                </SheetTitle>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Base Sepolia Escrow Portal
                </p>
              </div>
            </div>
          </SheetHeader>

          {/* Network & Gas Indicators */}
          <div className="p-4 border-b border-slate-100 space-y-2 bg-slate-50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5 font-mono">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                Base Sepolia:
              </span>
              <a
                href={`https://sepolia.basescan.org/address/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-slate-700 text-[11px] font-semibold hover:underline flex items-center gap-1"
              >
                {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}
                <ExternalLink className="size-3 text-slate-400" />
              </a>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Fuel className="size-3.5 text-slate-600" />
                Relayer Gas:
              </span>
              <span className="font-mono text-slate-900 text-[11px] font-semibold tabular-nums">
                {relayerGasEth} ETH
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors min-h-10",
                    isActive
                      ? "bg-slate-100 text-slate-900 font-semibold border border-slate-200/80 shadow-2xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon className={cn("size-4.5 shrink-0", isActive ? "text-slate-900" : "text-slate-400")} />
                  <span className="flex-1 truncate tracking-tight">{item.label}</span>
                  {item.badge && (
                    <Badge variant="amber" className="text-[10px] py-0 px-1.5 font-mono">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer / User Profile & Logout */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-md bg-slate-900 text-white font-bold text-xs font-mono">
                {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : "AD"}
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-900 truncate max-w-35">
                  {user?.displayName || "Super Admin"}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {user?.role || "ADMIN"}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setOpen(false);
                logout();
              }}
              aria-label="Đăng xuất"
              className="size-9 min-h-9 min-w-9 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

