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
          className="lg:hidden size-11 min-h-[44px] min-w-[44px] border-slate-800 bg-[#0F172A] text-slate-300 hover:text-white hover:bg-slate-800"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-[300px] sm:w-[340px] p-0 border-r border-slate-800 bg-[#0B0F17] flex flex-col justify-between"
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Header */}
          <SheetHeader className="p-4 border-b border-slate-800 text-left">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-950/40 text-cyan-400">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <SheetTitle className="text-sm font-mono font-bold tracking-tight text-white">
                  TrustPassz <span className="text-cyan-400 text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50">ADMIN</span>
                </SheetTitle>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Base Sepolia Escrow Portal
                </p>
              </div>
            </div>
          </SheetHeader>

          {/* Network & Gas Indicators */}
          <div className="p-4 border-b border-slate-800 space-y-2 bg-[#080C14]/60">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 font-mono">
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
                className="font-mono text-cyan-400 text-[11px] hover:underline flex items-center gap-1"
              >
                {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}
                <ExternalLink className="size-3" />
              </a>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Fuel className="size-3.5 text-cyan-400" />
                Relayer Gas:
              </span>
              <span className="font-mono text-white text-[11px] font-semibold">
                {relayerGasEth} ETH
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5">
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
                    "flex items-center gap-3 rounded-lg px-3.5 py-3 text-sm font-medium transition-colors min-h-[44px]",
                    isActive
                      ? "bg-cyan-950/50 text-cyan-400 border border-cyan-800/50 font-semibold"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  )}
                >
                  <Icon className={cn("size-5 shrink-0", isActive ? "text-cyan-400" : "text-slate-400")} />
                  <span className="flex-1 truncate">{item.label}</span>
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
        <div className="p-4 border-t border-slate-800 bg-[#080C14]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-full bg-cyan-950 text-cyan-400 font-semibold text-xs border border-cyan-800">
                {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : "AD"}
              </div>
              <div className="text-left">
                <p className="text-xs font-medium text-slate-200 truncate max-w-[140px]">
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
              className="size-11 min-h-[44px] min-w-[44px] text-rose-400 hover:bg-rose-950/40 hover:text-rose-300"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

