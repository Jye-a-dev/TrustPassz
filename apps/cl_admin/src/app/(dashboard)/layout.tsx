import * as React from "react";
import { AdminLayoutShell } from "@/components/layout/admin-layout-shell";

export const dynamic = "force-dynamic";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
