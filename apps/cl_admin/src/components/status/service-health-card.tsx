'use client';

import * as React from 'react';
import { Card, CardTitle } from '@/components/ui/card';
import type { SystemPillarStatus } from '@/types';
import { Clock, Lock, Globe, Server } from 'lucide-react';

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
          color: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
          dot: 'bg-emerald-500',
        };
      case 'degraded':
        return {
          label: 'Chậm / Cảnh báo (Degraded)',
          color: 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10',
          dot: 'bg-amber-500',
        };
      case 'down':
      default:
        return {
          label: 'Mất kết nối (Down)',
          color: 'border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10',
          dot: 'bg-rose-500',
        };
    }
  };

  const statusInfo = getStatusBadge();
  const isHttps = pillar.sslActive ?? pillar.endpoint.startsWith('https://');
  const isDeployed = pillar.environment === 'deployed';

  return (
    <Card className="rounded-xl border border-border-subtle bg-surface p-4 space-y-3 shadow-xs flex flex-col justify-between">
      <div className="flex items-start justify-between border-b border-border-subtle pb-2.5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${statusInfo.dot}`} />
            <CardTitle className="text-xs font-bold text-text-primary">
              {pillar.name}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-semibold flex items-center gap-1 ${
                isDeployed
                  ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-500'
                  : 'border-border-subtle bg-muted text-text-muted'
              }`}
            >
              {isDeployed ? <Globe className="size-2.5" /> : <Server className="size-2.5" />}
              {isDeployed ? 'PRODUCTION DEPLOYED' : 'LOCAL NODE'}
            </span>

            {isHttps && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <Lock className="size-2.5" />
                <span>HTTPS / SSL</span>
              </span>
            )}
          </div>
          <p className="font-mono text-[11px] text-text-muted truncate max-w-64" title={pillar.endpoint}>
            {pillar.endpoint}
          </p>
        </div>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${statusInfo.color}`}
        >
          {pillar.status.toUpperCase()}
        </span>
      </div>

      <div className="space-y-3 flex-1 text-xs">
        <div className="flex items-center justify-between text-text-muted">
          <span>Độ trễ phản hồi (Latency):</span>
          <span className="font-mono font-bold text-text-primary tabular-nums">
            {pillar.latencyMs} ms
          </span>
        </div>

        {pillar.httpStatus !== undefined && (
          <div className="flex items-center justify-between text-text-muted">
            <span>Mã phản hồi HTTP:</span>
            <span
              className={`font-mono font-semibold tabular-nums text-xs px-1.5 py-0.5 rounded ${
                pillar.httpStatus < 400
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-500'
              }`}
            >
              HTTP {pillar.httpStatus}
            </span>
          </div>
        )}

        {/* Detailed attributes list */}
        <div className="rounded-lg border border-border-subtle bg-muted/30 p-2.5 space-y-1.5 font-mono text-[11px]">
          {Object.entries(pillar.details).map(([key, val]) => (
            <div key={key} className="flex justify-between items-center text-text-secondary">
              <span className="text-text-muted">{key}:</span>
              <span className="text-right text-text-primary font-medium truncate max-w-44">
                {String(val)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-[10px] text-text-muted pt-1">
          <span className="flex items-center gap-1 font-mono">
            <Clock className="h-3 w-3 text-text-muted" />
            Check: {new Date(pillar.lastChecked).toLocaleTimeString('vi-VN')}
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">
            15s auto-poll
          </span>
        </div>
      </div>
    </Card>
  );
}
