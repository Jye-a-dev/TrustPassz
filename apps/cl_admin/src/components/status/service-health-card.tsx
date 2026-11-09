'use client';

import * as React from 'react';
import { Card, CardTitle } from '@/components/ui/card';
import type { SystemPillarStatus } from '@/types';
import { Clock } from 'lucide-react';

interface ServiceHealthCardProps {
  pillar: SystemPillarStatus;
  onRefresh?: () => void;
}

export function ServiceHealthCard({ pillar }: ServiceHealthCardProps) {
  const getStatusBadge = () => {
    switch (pillar.status) {
      case 'healthy':
        return {
          label: 'Hoạt động tốt (Healthy)',
          color: 'border-emerald-200 text-emerald-700 bg-emerald-50',
          dot: 'bg-emerald-500',
        };
      case 'degraded':
        return {
          label: 'Chậm / Cảnh báo (Degraded)',
          color: 'border-amber-200 text-amber-700 bg-amber-50',
          dot: 'bg-amber-500',
        };
      case 'down':
      default:
        return {
          label: 'Mất kết nối (Down)',
          color: 'border-rose-200 text-rose-700 bg-rose-50',
          dot: 'bg-rose-500',
        };
    }
  };

  const statusInfo = getStatusBadge();

  return (
    <Card className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs flex flex-col justify-between">
      <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
        <div className="space-y-0.5">
          <CardTitle className="text-xs font-bold text-slate-900 flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${statusInfo.dot}`} />
            {pillar.name}
          </CardTitle>
          <p className="font-mono text-[11px] text-slate-400 truncate max-w-55">
            {pillar.endpoint}
          </p>
        </div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${statusInfo.color}`}>
          {pillar.status.toUpperCase()}
        </span>
      </div>

      <div className="space-y-3 flex-1 text-xs">
        <div className="flex items-center justify-between text-slate-500">
          <span>Độ trễ phản hồi (Latency):</span>
          <span className="font-mono font-bold text-slate-900 tabular-nums">
            {pillar.latencyMs} ms
          </span>
        </div>

        {/* Detailed attributes list */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 space-y-1.5 font-mono text-[11px]">
          {Object.entries(pillar.details).map(([key, val]) => (
            <div key={key} className="flex justify-between items-center text-slate-700">
              <span className="text-slate-400">{key}:</span>
              <span className="text-right text-slate-900 font-medium truncate max-w-42.5">
                {String(val)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
          <span className="flex items-center gap-1 font-mono">
            <Clock className="h-3 w-3 text-slate-400" />
            Check: {new Date(pillar.lastChecked).toLocaleTimeString('vi-VN')}
          </span>
          <span className="text-emerald-700 font-mono font-medium">15s auto-poll</span>
        </div>
      </div>
    </Card>
  );
}
