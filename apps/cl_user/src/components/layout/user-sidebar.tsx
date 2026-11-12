"use client";

import * as React from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useUIStore } from "@/lib/store";
import { UserSidebarContent } from "./user-sidebar-content";
import { BASE_NAV_ITEMS, isRouteActive, type NavItem } from "./user-sidebar-nav-items";

export { BASE_NAV_ITEMS, isRouteActive, UserSidebarContent };
export type { NavItem };

interface UserSidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  lockedBalanceVND?: number;
  activeCount?: number;
}

export function UserSidebar({
  isOpenMobile,
  onCloseMobile,
  lockedBalanceVND = 0,
  activeCount,
}: UserSidebarProps) {
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();

  return (
    <>
      {/* Desktop Fixed Sidebar (Dynamic w-64 / w-20 based on collapsed state) */}
      <aside
        className={cn(
          "hidden md:flex md:flex-col md:fixed md:inset-y-0 z-40 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs transition-all duration-300",
          sidebarCollapsed ? "md:w-20" : "md:w-64"
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center border-b border-slate-200 dark:border-slate-800",
            sidebarCollapsed ? "justify-center px-2" : "px-6 justify-between"
          )}
        >
          <Link
            href="/user"
            className="flex items-center gap-2.5 transition-transform hover:scale-[1.02]"
            title="TrustPassz - Sàn Ký Quỹ An Toàn"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-rose-50 border border-rose-200 text-rose-500 shadow-sm p-1 shrink-0">
              <Shield className="size-5 text-rose-500" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
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
            )}
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <UserSidebarContent
            lockedBalanceVND={lockedBalanceVND}
            activeCount={activeCount}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebarCollapsed}
          />
        </div>
      </aside>

      {/* Mobile Drawer (Sheet) */}
      <Sheet open={isOpenMobile} onOpenChange={onCloseMobile}>
        <SheetContent
          side="left"
          className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 p-0 w-72"
        >
          <SheetHeader className="p-4 border-b border-slate-200 dark:border-slate-800 text-left">
            <SheetTitle className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-rose-50 border border-rose-200 text-rose-500">
                <Shield className="size-4.5" />
              </div>
              <div>
                <span className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
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
              isCollapsed={false}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
