'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
          color: 'border-emerald-800 text-emerald-400 bg-emerald-950/40',
          dot: 'bg-emerald-400',
        };
      case 'degraded':
        return {
          label: 'Chậm / Cảnh báo (Degraded)',
          color: 'border-amber-800 text-amber-400 bg-amber-950/40',
          dot: 'bg-amber-400',
        };
      case 'down':
      default:
        return {
          label: 'Mất kết nối (Down)',
          color: 'border-rose-800 text-rose-400 bg-rose-950/40',
          dot: 'bg-rose-400',
        };
    }
  };

  const statusInfo = getStatusBadge();

  return (
    <Card className="border-slate-800 bg-[#0F172A] shadow-md flex flex-col justify-between">
      <CardHeader className="border-b border-slate-800 pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${statusInfo.dot} animate-pulse`} />
              {pillar.name}
            </CardTitle>
            <p className="font-mono text-[11px] text-slate-500 truncate max-w-[220px]">
              {pillar.endpoint}
            </p>
          </div>
          <Badge variant="outline" className={`text-[10px] font-mono ${statusInfo.color}`}>
            {pillar.status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-3 flex-1 text-xs">
        <div className="flex items-center justify-between text-slate-400">
          <span>Độ trễ phản hồi (Latency):</span>
          <span className="font-mono font-bold text-cyan-400">
            {pillar.latencyMs} ms
          </span>
        </div>

        {/* Detailed attributes list */}
        <div className="rounded-lg border border-slate-800 bg-[#080C14] p-2.5 space-y-1.5 font-mono text-[11px]">
          {Object.entries(pillar.details).map(([key, val]) => (
            <div key={key} className="flex justify-between items-center text-slate-300">
              <span className="text-slate-500">{key}:</span>
              <span className="text-right text-slate-200 truncate max-w-[170px]">
                {String(val)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Check: {new Date(pillar.lastChecked).toLocaleTimeString('vi-VN')}
          </span>
          <span className="text-emerald-400 font-mono">15s auto-poll</span>
        </div>
      </CardContent>
    </Card>
  );
}
