'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Scale,
  ShieldAlert,
  Bot,
  Activity,
  Users,
  Terminal,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Tổng quan điều hành',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Kèo & Escrow State',
    href: '/deals',
    icon: Scale,
  },
  {
    label: 'Hàng đợi tranh chấp',
    href: '/disputes',
    icon: ShieldAlert,
    badge: 'AI Queue',
  },
  {
    label: 'Kiểm định AI Lab',
    href: '/ai-lab',
    icon: Bot,
  },
  {
    label: '5 Trụ cột Hệ thống',
    href: '/system-status',
    icon: Activity,
  },
  {
    label: 'Người dùng & RBAC',
    href: '/users',
    icon: Users,
  },
  {
    label: 'Super API Explorer',
    href: '/api-explorer',
    icon: Terminal,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-slate-800 bg-[#0B0F17] transition-all duration-300 select-none z-30',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Sidebar Header & Toggle */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
              Admin Portal
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0 text-slate-400 hover:bg-slate-800 hover:text-white ml-auto"
          title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-800/40 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              )}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-cyan-400 shadow-sm shadow-cyan-400" />
              )}
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-colors',
                  isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                )}
              />
              {!collapsed && (
                <span className="flex-1 truncate tracking-tight">{item.label}</span>
              )}
              {!collapsed && item.badge && (
                <span className="rounded bg-amber-950/60 border border-amber-800/50 px-1.5 py-0.5 text-[10px] font-mono text-amber-400">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="border-t border-slate-800 p-3">
        {!collapsed ? (
          <div className="rounded-lg border border-slate-800/80 bg-[#080C14]/60 p-2.5 text-[11px] text-slate-400">
            <div className="flex items-center justify-between text-slate-300">
              <span className="font-semibold">TrustPassz Core</span>
              <span className="font-mono text-emerald-400 text-[10px]">v1.2.0</span>
            </div>
            <p className="mt-1 text-[10px] text-slate-500">Autonomous Escrow & AI Arbitrator</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <ShieldCheck className="h-5 w-5 text-slate-500" />
          </div>
        )}
      </div>
    </aside>
  );
}
