import * as React from 'react';
import { AdminAuthGuard } from '@/components/auth/admin-auth-guard';
import { AdminNavbar } from '@/components/layout/admin-navbar';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AdminFooter } from '@/components/layout/admin-footer';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AdminAuthGuard>
      <div className="flex h-screen w-full flex-col bg-[#080C14] text-slate-100 overflow-hidden font-sans">
        {/* Topbar Navbar */}
        <AdminNavbar />

        {/* Main Body with Sidebar + Content */}
        <div className="flex flex-1 overflow-hidden">
          <AdminSidebar />

          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
              {children}
            </div>
          </main>
        </div>

        {/* Bottom Footer */}
        <AdminFooter />
      </div>
    </AdminAuthGuard>
  );
}
