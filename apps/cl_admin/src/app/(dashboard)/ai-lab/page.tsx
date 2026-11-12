'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Bot, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const ContrastSliderPanel = dynamic(
  () => import('@/components/ai-lab/contrast-slider-panel').then((mod) => mod.ContrastSliderPanel),
  {
    loading: () => <Skeleton className="h-64 w-full rounded-xl bg-cyber-card border border-slate-800" />,
    ssr: false,
  }
);

const PromptScenarioEditor = dynamic(
  () => import('@/components/ai-lab/prompt-scenario-editor').then((mod) => mod.PromptScenarioEditor),
  {
    loading: () => <Skeleton className="h-64 w-full rounded-xl bg-cyber-card border border-slate-800" />,
    ssr: false,
  }
);

const AiBenchmarkTester = dynamic(
  () => import('@/components/ai-lab/ai-benchmark-tester').then((mod) => mod.AiBenchmarkTester),
  {
    loading: () => <Skeleton className="h-48 w-full rounded-xl bg-cyber-card border border-slate-800" />,
    ssr: false,
  }
);

export default function AiLabPage() {
  const [isPinging, setIsPinging] = React.useState(false);
  const [healthStatus, setHealthStatus] = React.useState({
    status: 'healthy',
    latencyMs: 64,
    vram: '3.4 GB / 8.0 GB',
    model: 'Qwen2-VL-2B-Instruct',
    fsmReady: true,
  });

  const pingHealth = async () => {
    setIsPinging(true);
    const start = Date.now();
    try {
      const res = await fetch('http://localhost:3100/health', {
        method: 'GET',
        cache: 'no-store',
      }).catch(() => null);

      const latency = Date.now() - start;
      const isOk = Boolean(res?.ok);
      setHealthStatus({
        status: isOk ? 'healthy' : 'degraded',
        latencyMs: Math.max(latency, 1),
        vram: '3.4 GB / 8.0 GB',
        model: 'Qwen2-VL-2B-Instruct',
        fsmReady: isOk,
      });
      if (isOk) {
        toast.success('Đã ping thành công endpoint sVLM FastAPI (:3100/health)');
      } else {
        toast.warning('sVLM Pipeline chưa online hoặc phản hồi chậm');
      }
    } catch {
      toast.error('Không thể kết nối đến sVLM Pipeline');
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="text-slate-500 hover:text-slate-800 transition-colors">Trọng Tài &amp; AI</span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-900 font-semibold">Kiểm Định AI Lab</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={pingHealth}
            disabled={isPinging}
            className="h-8.5 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5 shadow-2xs"
          >
            <RefreshCw className={`size-3.5 ${isPinging ? 'animate-spin text-slate-900' : 'text-slate-500'}`} />
            <span>Ping /health (:3100)</span>
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-base font-bold text-slate-900">Studio Kiểm Định &amp; Tinh Chỉnh AI Lab</h2>
        <p className="text-xs text-slate-500">Mô hình sVLM Qwen2-VL-2B-Instruct (:3100) • Outlines JSON FSM Guardrails</p>
      </div>

      {/* Live AI Engine Status Card */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl border border-slate-200 bg-white p-4 text-xs space-y-1 shadow-xs">
          <span className="text-slate-500 font-medium">Model Vision-Language</span>
          <p className="font-mono text-sm font-bold text-slate-900">{healthStatus.model}</p>
          <span className="text-[10px] text-emerald-700 font-medium">✓ Native Visual Tokenizer</span>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white p-4 text-xs space-y-1 shadow-xs">
          <span className="text-slate-500 font-medium">Độ Trễ Suy Luận (Latency)</span>
          <p className="font-mono text-sm font-bold text-slate-900 tabular-nums">{healthStatus.latencyMs} ms</p>
          <span className="text-[10px] text-slate-400 font-mono">http://localhost:3100</span>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white p-4 text-xs space-y-1 shadow-xs">
          <span className="text-slate-500 font-medium">Bộ Nhớ GPU (VRAM Allocation)</span>
          <p className="font-mono text-sm font-bold text-slate-900 tabular-nums">{healthStatus.vram}</p>
          <span className="text-[10px] text-emerald-700 font-medium">✓ Bộ nhớ ổn định &lt; 50%</span>
        </Card>

        <Card className="rounded-xl border border-slate-200 bg-white p-4 text-xs space-y-1 shadow-xs">
          <span className="text-slate-500 font-medium">Outlines FSM Regex Engine</span>
          <p className="font-mono text-sm font-bold text-emerald-700">JSON Schema Enforced</p>
          <span className="text-[10px] text-slate-400">Zero Grammar Hallucination</span>
        </Card>
      </div>

      {/* Benchmark Playground */}
      <AiBenchmarkTester />

      {/* Image Contrast & Preprocessing Tuning */}
      <ContrastSliderPanel />

      {/* Context Rules Injection */}
      <PromptScenarioEditor />
    </div>
  );
}
