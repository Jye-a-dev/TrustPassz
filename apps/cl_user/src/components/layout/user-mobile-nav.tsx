"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Handshake,
  PlusCircle,
  Settings,
  Receipt,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isRouteActive } from "./user-sidebar";

interface MobileTab {
  label: string;
  href: string;
  icon: React.ElementType;
  isAction?: boolean;
}

const MOBILE_TABS: MobileTab[] = [
  {
    label: "Tổng Quan",
    href: "/user",
    icon: LayoutDashboard,
  },
  {
    label: "Giao Dịch",
    href: "/user/deals",
    icon: Handshake,
  },
  {
    label: "Tạo Mới",
    href: "/user/deals/create",
    icon: PlusCircle,
    isAction: true,
  },
  {
    label: "Đơn Hàng",
    href: "/user/orders",
    icon: Receipt,
  },
  {
    label: "Cài Đặt",
    href: "/user/settings",
    icon: Settings,
  },
];

export function UserMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800/80 bg-[#070A10]/95 px-3 py-1.5 backdrop-blur-2xl md:hidden"
      aria-label="Điều hướng mobile đáy trang"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {MOBILE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = isRouteActive(pathname, tab.href);

          if (tab.isAction) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center justify-center min-w-12 min-h-12 -mt-4 group"
                aria-label={tab.label}
              >
                <div className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.45)] transition-transform group-active:scale-95">
                  <Icon className="size-6 text-slate-950 font-bold" />
                </div>
                <span className="text-[10px] font-bold text-emerald-400 mt-0.5">
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center min-w-11 min-h-11 py-1 rounded-xl transition-all",
                isActive
                  ? "text-cyan-400"
                  : "text-slate-400 hover:text-slate-200 active:bg-slate-900/50"
              )}
              aria-label={tab.label}
            >
              <Icon
                className={cn(
                  "size-5 transition-transform",
                  isActive && "scale-110 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium leading-tight mt-1",
                  isActive ? "text-cyan-300 font-bold" : "text-slate-400"
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
