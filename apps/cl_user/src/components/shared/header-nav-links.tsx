"use client";

import * as React from "react";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const GUEST_NAV_ITEMS = [
  { label: "Khám phá Kèo", href: "/explore" },
  { label: "Quy trình Ký quỹ", href: "/#how-it-works" },
  { label: "Bàn Đàm Phán Demo", href: "/deals/demo" },
  { label: "Bảo mật Két Vault", href: "/#pillars" },
];

export const AUTH_NAV_ITEMS = [
  { label: "Khám phá", href: "/explore" },
  { label: "Kèo của tôi", href: "/user/deals" },
  { label: "Đơn hàng", href: "/user/orders" },
  { label: "Dashboard", href: "/user" },
];

interface HeaderNavLinksProps {
  isAuth: boolean;
  pathname: string;
}

export function HeaderNavLinks({ isAuth, pathname }: HeaderNavLinksProps) {
  return (
    <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
      {isAuth ? (
        <>
          {AUTH_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition-colors hover:text-cyan-300 text-xs sm:text-sm py-1.5",
                pathname === item.href
                  ? "text-cyan-400 font-semibold"
                  : "text-slate-300"
              )}
            >
              {item.label}
            </Link>
          ))}

          <Link
            href="/user/deals/create"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              "bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
            )}
          >
            <PlusCircle className="size-3.5 text-emerald-400" />
            <span>+ Tạo Kèo Mới</span>
          </Link>
        </>
      ) : (
        <>
          {GUEST_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition-colors hover:text-cyan-300 text-xs sm:text-sm py-1.5",
                pathname === item.href
                  ? "text-cyan-400 font-semibold"
                  : "text-slate-300"
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
