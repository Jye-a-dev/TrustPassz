"use client";

import * as React from "react";
import { AdminAuthGuard } from "@/components/auth/admin-auth-guard";
import { AdminNavbar } from "@/components/layout/admin-navbar";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminFooter } from "@/components/layout/admin-footer";

interface AdminLayoutShellProps {
  children: React.ReactNode;
}

export function AdminLayoutShell({ children }: AdminLayoutShellProps) {
  return (
    <AdminAuthGuard>
      <div className="flex h-screen w-full flex-col bg-cyber-bg text-text-primary overflow-hidden font-sans select-none antialiased">
        {/* Top Sticky Navbar */}
        <AdminNavbar />

        {/* Body Container: Collapsible Sidebar + Content Viewport */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Desktop Fixed/Collapsible Sidebar */}
          <AdminSidebar />

          {/* Scrollable Main Content (Zero Horizontal Overflow) */}
          <main
            id="admin-main-content"
            className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 md:p-6 lg:p-8 scrollbar-thin focus:outline-none"
            tabIndex={-1}
          >
            <div className="mx-auto max-w-7xl space-y-6">
              {children}
            </div>
          </main>
        </div>

        {/* Global Bottom Status Footer */}
        <AdminFooter />
      </div>
    </AdminAuthGuard>
  );
}

