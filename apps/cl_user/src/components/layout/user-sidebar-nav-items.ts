import type * as React from "react";
import {
  LayoutDashboard,
  Layers,
  Receipt,
  Scale,
  Settings,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

export function isRouteActive(currentPath: string, targetHref: string): boolean {
  if (targetHref === "/user") {
    return currentPath === "/user";
  }
  if (targetHref === "/user/deals") {
    return (
      currentPath === "/user/deals" ||
      currentPath.startsWith("/user/deals/")
    );
  }
  return currentPath === targetHref || currentPath.startsWith(targetHref + "/");
}

export const BASE_NAV_ITEMS: Omit<NavItem, "badge" | "badgeColor">[] = [
  {
    label: "Tổng quan",
    href: "/user",
    icon: LayoutDashboard,
  },
  {
    label: "Kèo của tôi",
    href: "/user/deals",
    icon: Layers,
  },
  {
    label: "Đơn hàng & Hóa đơn",
    href: "/user/orders",
    icon: Receipt,
  },
  {
    label: "Tranh chấp & Khiếu nại",
    href: "/user/disputes",
    icon: Scale,
  },
  {
    label: "Cài đặt & Ví nhận tiền",
    href: "/user/settings",
    icon: Settings,
  },
];
