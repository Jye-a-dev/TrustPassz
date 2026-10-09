"use client";

import * as React from "react";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const GUEST_NAV_ITEMS = [
  { label: "Khám phá Giao dịch", href: "/explore" },
  { label: "Quy trình Giữ tiền an toàn", href: "/#how-it-works" },
  { label: "Phòng Thương Lượng Mẫu", href: "/deals/demo" },
  { label: "Bảo mật Kho lưu trữ", href: "/#pillars" },
];

export const AUTH_NAV_ITEMS = [
  { label: "Khám phá", href: "/explore" },
  { label: "Giao dịch của tôi", href: "/user/deals" },
  { label: "Đơn hàng", href: "/user/orders" },
  { label: "Bàn điều hành", href: "/user" },
];

interface HeaderNavLinksProps {
  isAuth: boolean;
  pathname: string;
}

export function HeaderNavLinks({ isAuth, pathname }: HeaderNavLinksProps) {
  return (
    <nav className="hidden md:flex items-center gap-2 lg:gap-3 xl:gap-5 text-sm font-medium shrink-0">
      {isAuth ? (
        <>
          {AUTH_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition-colors text-xs lg:text-sm py-1.5 px-2 rounded-lg whitespace-nowrap shrink-0",
                pathname === item.href
                  ? "text-cyan-600 dark:text-cyan-400 font-semibold bg-cyan-50/80 dark:bg-cyan-950/40"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
              )}
            >
              {item.label}
            </Link>
          ))}

          <Link
            href="/user/deals/create"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap shrink-0",
              "bg-emerald-500/10 border border-emerald-500/30 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
            )}
          >
            <PlusCircle className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>+ Tạo Giao Dịch</span>
          </Link>
        </>
      ) : (
        <>
          {GUEST_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition-colors text-xs lg:text-sm py-1.5 px-2 rounded-lg whitespace-nowrap shrink-0",
                pathname === item.href
                  ? "text-cyan-600 dark:text-cyan-400 font-semibold bg-cyan-50/80 dark:bg-cyan-950/40"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
              )}
            >
              {item.label}
            </Link>
          ))}
        </>
      )}
    </nav>
  );
}
