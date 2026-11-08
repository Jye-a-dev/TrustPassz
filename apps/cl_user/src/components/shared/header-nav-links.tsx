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
                "transition-colors text-xs lg:text-sm py-1.5 px-2.5 rounded-xl whitespace-nowrap shrink-0 font-medium",
                pathname === item.href
                  ? "text-rose-600 font-bold bg-rose-50 border border-rose-200 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
              )}
            >
              {item.label}
            </Link>
          ))}

          <Link
            href="/user/deals/create"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap shrink-0",
              "bg-rose-500 hover:bg-rose-600 text-white border border-rose-600 shadow-sm active:translate-y-0.5"
            )}
          >
            <PlusCircle className="size-3.5 text-white" />
            <span>+ Đăng Bán</span>
          </Link>
        </>
      ) : (
        <>
          {GUEST_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition-colors text-xs lg:text-sm py-1.5 px-2.5 rounded-xl whitespace-nowrap shrink-0 font-medium",
                pathname === item.href
                  ? "text-rose-600 font-bold bg-rose-50 border border-rose-200 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
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
