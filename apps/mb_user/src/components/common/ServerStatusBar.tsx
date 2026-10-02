import React, { useEffect, useState } from 'react';
import { checkBackendHealth } from '../../services/health.service';
import type { HealthStatus } from '../../types';

export const ServerStatusBar: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus>({
    status: 'offline',
    service: 'Connecting...',
    timestamp: '',
    latencyMs: 0,
  });

  const runHealthCheck = async () => {
    const res = await checkBackendHealth();
    setHealth(res);
  };

  useEffect(() => {
    runHealthCheck();
    const interval = setInterval(runHealthCheck, 15000);
    return () => clearInterval(interval);
  }, []);

  const isOnline = health.status === 'ok';

  return (
    <div className="w-full bg-[#0B0F17]/95 border-b border-[#1E293B] px-3 py-1.5 flex items-center justify-between text-[11px] font-mono select-none backdrop-blur-sm z-40">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          {isOnline && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isOnline ? 'bg-[#10B981]' : 'bg-[#EF4444]'
            }`}
          />
        </span>
        <span className={isOnline ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
          {isOnline ? 'Escrow Ready' : 'Server Offline'}
        </span>
      </div>

      <div className="flex items-center gap-2 text-slate-400">
        <span>{isOnline ? `${health.latencyMs}ms` : 'Retrying...'}</span>
        <button
          onClick={runHealthCheck}
          className="text-slate-500 hover:text-cyan-400 p-0.5 active:scale-95 transition-transform"
          title="Kiểm tra lại kết nối"
        >
          ↻
        </button>
      </div>
    </div>
  );
};

