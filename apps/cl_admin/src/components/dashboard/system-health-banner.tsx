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
    <div className="rounded-xl border border-border-subtle bg-surface p-4 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-6 text-xs font-mono">
        {pillars.length === 0 ? (
          <div className="flex items-center gap-2 text-text-muted font-sans">
            <span className="size-2 rounded-full bg-border-strong animate-pulse" />
            <span>Đang kiểm tra ma trận trụ cột hệ thống...</span>
          </div>
        ) : (
          pillars.slice(0, 5).map((p) => (
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
              <span className="font-semibold text-text-primary font-sans">{p.name.split(' (')[0]}:</span>
              <span className="text-text-muted tabular-nums">{p.latencyMs}ms</span>
            </div>
          ))
        )}
      </div>
      <Link
        href="/system-status"
        className="text-xs font-medium text-text-secondary hover:text-text-primary flex items-center gap-1 shrink-0 font-sans transition-colors"
      >
        <span>Chi tiết ma trận</span>
        <ArrowRight className="size-3.5 text-text-muted" />
      </Link>
    </div>
  );
}
