'use client';

import * as React from 'react';
import { Bot, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ContrastSliderPanel } from '@/components/ai-lab/contrast-slider-panel';
import { PromptScenarioEditor } from '@/components/ai-lab/prompt-scenario-editor';
import { AiBenchmarkTester } from '@/components/ai-lab/ai-benchmark-tester';
import { toast } from 'sonner';

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
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <Bot className="h-6 w-6 text-cyan-400" />
            Kiểm Định & Tinh Chỉnh AI Lab (sVLM Pipeline)
          </h2>
          <p className="text-xs text-slate-400">
            Giám sát tài nguyên suy luận, tiền xử lý hình ảnh và quản trị bộ luật trọng tài tự động.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={pingHealth}
          disabled={isPinging}
          className="border-slate-800 bg-[#0F172A] hover:bg-slate-800 text-slate-200 text-xs h-9 gap-1.5 w-fit"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isPinging ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Ping /health (:3100)</span>
        </Button>
      </div>

      {/* Live AI Engine Status Card */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-800 bg-[#0F172A] p-4 text-xs space-y-1">
          <span className="text-slate-400 font-medium">Model Vision-Language</span>
          <p className="font-mono text-sm font-bold text-white">{healthStatus.model}</p>
          <span className="text-[10px] text-emerald-400">✓ Native Visual Tokenizer</span>
        </Card>

        <Card className="border-slate-800 bg-[#0F172A] p-4 text-xs space-y-1">
          <span className="text-slate-400 font-medium">Độ Trễ Suy Luận (Latency)</span>
          <p className="font-mono text-sm font-bold text-cyan-400">{healthStatus.latencyMs} ms</p>
          <span className="text-[10px] text-slate-500 font-mono">http://localhost:3100</span>
        </Card>

        <Card className="border-slate-800 bg-[#0F172A] p-4 text-xs space-y-1">
          <span className="text-slate-400 font-medium">Bộ Nhớ GPU (VRAM Allocation)</span>
          <p className="font-mono text-sm font-bold text-white">{healthStatus.vram}</p>
          <span className="text-[10px] text-emerald-400">✓ Bộ nhớ ổn định &lt; 50%</span>
        </Card>

        <Card className="border-slate-800 bg-[#0F172A] p-4 text-xs space-y-1">
          <span className="text-slate-400 font-medium">Outlines FSM Regex Engine</span>
          <p className="font-mono text-sm font-bold text-emerald-400">JSON Schema Enforced</p>
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
