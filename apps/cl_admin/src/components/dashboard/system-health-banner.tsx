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

  const healthyCount = pillars.filter((p) => p.status === 'healthy').length;
  const totalCount = pillars.length || 5;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between rounded-xl border border-slate-800 bg-[#0F172A] p-4 shadow-sm gap-4">
      <div className="flex items-center space-x-3.5">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
          healthyCount === totalCount
            ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-400'
            : 'border-amber-500/30 bg-amber-950/40 text-amber-400'
        }`}>
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-semibold text-white">
              Hệ Thống Trực Tuyến & Đồng Bộ
            </h4>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-mono ${
              healthyCount === totalCount
                ? 'bg-emerald-950 border-emerald-800 text-emerald-400'
                : 'bg-amber-950 border-amber-800 text-amber-400'
            }`}>
              {pillars.length ? `${healthyCount}/${totalCount} Operational` : 'Checking...'}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
            {pillars.map((p) => (
              <span key={p.id} className="flex items-center space-x-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${
                    p.status === 'healthy'
                      ? 'bg-emerald-400'
                      : p.status === 'degraded'
                      ? 'bg-amber-400'
                      : 'bg-rose-400'
                  }`}
                />
                <span className="text-[11px] font-mono">
                  {p.name.split(' ')[0]} ({p.latencyMs}ms)
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <Link href="/system-status" className="shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="border-slate-800 bg-[#080C14] hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 text-xs h-9 gap-1.5"
        >
          <span>Chi tiết Ma trận 5 Trụ cột</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </Link>
    </div>
  );
}
