import * as React from 'react';
import Link from 'next/link';
import { Activity, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';


import { checkAllPillars } from '@/lib/system-monitor';
import type { SystemPillarStatus } from '@/types';

export function SystemHealthBanner() {
  const [pillars, setPillars] = React.useState<SystemPillarStatus[]>([]);

  React.useEffect(() => {
    let mounted = true;
    checkAllPillars().then((res) => {
      if (mounted) setPillars(res);
    }).catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-6 text-xs font-mono">
        {pillars.length === 0 ? (
          <div className="flex items-center gap-2 text-slate-400 font-sans">
            <span className="size-2 rounded-full bg-slate-300 animate-pulse" />
            <span>Đang kiểm tra 5 trụ cột hệ thống...</span>
          </div>
        ) : (
          pillars.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <span
                className={`size-2 rounded-full ${
                  p.status === 'healthy'
                    ? 'bg-emerald-500'
                    : p.status === 'degraded'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
              />
              <span className="font-semibold text-slate-800 font-sans">{p.name}:</span>
              <span className="text-slate-500 tabular-nums">{p.latencyMs}ms</span>
            </div>
          ))
        )}
      </div>
      <Link
        href="/system-status"
        className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 shrink-0 font-sans transition-colors"
      >
        <span>Chi tiết ma trận</span>
        <ArrowRight className="size-3.5 text-slate-400" />
      </Link>
    </div>
  );
}
