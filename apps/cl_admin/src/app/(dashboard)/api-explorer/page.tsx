'use client';

import * as React from 'react';
import {
  Terminal,
  Play,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { apiClient, ApiError } from '@/lib/api-client';
import { logAdminAction } from '@/lib/audit-logger';
import { toast } from 'sonner';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface PresetEndpoint {
  name: string;
  method: HttpMethod;
  endpoint: string;
  defaultBody?: string;
}

const PRESETS: PresetEndpoint[] = [
  {
    name: '1. Thống kê Deal & Breakdown (GET)',
    method: 'GET',
    endpoint: '/api/v1/deals/count',
  },
  {
    name: '2. Danh sách Kèo Escrow (GET)',
    method: 'GET',
    endpoint: '/api/v1/deals?page=1&limit=5',
  },
  {
    name: '3. Danh sách Khiếu nại (GET)',
    method: 'GET',
    endpoint: '/api/v1/disputes',
  },
  {
    name: '4. Sinh Nonce Xác thực (GET)',
    method: 'GET',
    endpoint: '/api/v1/auth/nonce',
  },
  {
    name: '5. Danh sách Người dùng (GET)',
    method: 'GET',
    endpoint: '/api/v1/users',
  },
  {
    name: '6. Mở Khiếu nại Mẫu (POST)',
    method: 'POST',
    endpoint: '/api/v1/disputes',
    defaultBody: JSON.stringify(
      {
        dealId: 'd0000000-0000-4000-a000-000000000001',
        reason: 'Super Admin manual dispute trigger for testing AI arbitration pipeline.',
        evidenceUrls: ['https://trustpassz.io/evidence/sample.png'],
      },
      null,
      2
    ),
  },
];

export default function ApiExplorerPage() {
  const [method, setMethod] = React.useState<HttpMethod>('GET');
  const [endpoint, setEndpoint] = React.useState('/api/v1/deals/count');
  const [payload, setPayload] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [responseStatus, setResponseStatus] = React.useState<number | null>(null);
  const [responseData, setResponseData] = React.useState<unknown>(null);
  const [latencyMs, setLatencyMs] = React.useState<number | null>(null);
  const [copied, setCopied] = React.useState(false);

  const applyPreset = (preset: PresetEndpoint) => {
    setMethod(preset.method);
    setEndpoint(preset.endpoint);
    setPayload(preset.defaultBody || '');
    toast.info(`Đã tải preset: ${preset.name}`);
  };

  const handleExecute = async () => {
    setIsLoading(true);
    setResponseStatus(null);
    setResponseData(null);
    setLatencyMs(null);

    const start = Date.now();
    try {
      let bodyData: unknown = undefined;
      if ((method === 'POST' || method === 'PATCH') && payload.trim()) {
        try {
          bodyData = JSON.parse(payload);
        } catch {
          toast.error('Payload JSON không hợp lệ! Vui lòng kiểm tra cú pháp.');
          setIsLoading(false);
          return;
        }
      }

      let res: unknown;
      if (method === 'GET') {
        res = await apiClient.get(endpoint);
      } else if (method === 'POST') {
        res = await apiClient.post(endpoint, bodyData);
      } else if (method === 'PATCH') {
        res = await apiClient.patch(endpoint, bodyData);
      } else if (method === 'DELETE') {
        res = await apiClient.delete(endpoint);
      }

      const elapsed = Date.now() - start;
      setResponseStatus(200);
      setResponseData(res);
      setLatencyMs(elapsed);
      toast.success(`Thực thi API thành công (HTTP 200 • ${elapsed}ms)`);

      // Audit log
      await logAdminAction('API_EXPLORER_INVOCATION', 'api_routes', endpoint, {
        method,
        status: 200,
        elapsed,
      });
    } catch (err: unknown) {
      const elapsed = Date.now() - start;
      setLatencyMs(elapsed);
      if (err instanceof ApiError) {
        setResponseStatus(err.status);
        setResponseData(err.data || err.message);
        toast.error(`API trả về lỗi ${err.status}: ${err.statusText}`);
      } else {
        setResponseStatus(500);
        setResponseData({
          error: err instanceof Error ? err.message : 'Lỗi kết nối máy chủ',
          endpoint,
          method,
          timestamp: new Date().toISOString(),
        });
        toast.error('Lỗi kết nối tới endpoint API');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!responseData) return;
    navigator.clipboard.writeText(JSON.stringify(responseData, null, 2));
    setCopied(true);
    toast.success('Đã sao chép phản hồi vào clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const getMethodBadgeClass = (m: HttpMethod) => {
    switch (m) {
      case 'GET':
        return 'border-emerald-800 text-emerald-400 bg-emerald-950/40';
      case 'POST':
        return 'border-cyan-800 text-cyan-400 bg-cyan-950/40';
      case 'PATCH':
        return 'border-amber-800 text-amber-400 bg-amber-950/40';
      case 'DELETE':
        return 'border-rose-800 text-rose-400 bg-rose-950/40';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <Terminal className="h-6 w-6 text-cyan-400" />
            Universal Super Admin API Explorer
          </h2>
          <p className="text-xs text-slate-400">
            Trực tiếp gọi và kiểm tra các endpoint RESTful `/api/v1/*` của Backend NestJS (:3001) với JWT Admin.
          </p>
        </div>
        <Badge variant="outline" className="border-cyan-800 text-cyan-400 font-mono text-xs w-fit">
          Super Admin CRUD Root
        </Badge>
      </div>

      {/* Preset Quick Selectors */}
      <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-3 text-xs space-y-2">
        <span className="font-semibold text-slate-300">Quick Presets (Các mẫu yêu cầu thường dùng):</span>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(p)}
              className="rounded-md border border-slate-800 bg-[#080C14] hover:bg-slate-800 px-2.5 py-1 text-[11px] text-slate-300 transition-colors flex items-center gap-1.5"
            >
              <span className={`font-mono font-bold text-[9px] px-1 rounded ${getMethodBadgeClass(p.method)}`}>
                {p.method}
              </span>
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Query Request Builder */}
      <Card className="border-slate-800 bg-[#0F172A] shadow-md">
        <CardHeader className="pb-3 border-b border-slate-800">
          <CardTitle className="text-sm font-semibold text-white">
            Bộ Soạn Thảo Yêu Cầu (Request Builder)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4 text-xs">
          {/* Method and Endpoint Input */}
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as HttpMethod)}
              className="w-full sm:w-32 h-10 rounded-md border border-slate-800 bg-[#080C14] px-3 font-mono text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>

            <Input
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="/api/v1/deals/count"
              className="flex-1 font-mono text-xs border-slate-800 bg-[#080C14] text-cyan-300 h-10"
            />

            <Button
              onClick={handleExecute}
              disabled={isLoading}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs h-10 px-5 gap-1.5 shrink-0"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              <span>Thực Thi (Send)</span>
            </Button>
          </div>

          {/* JSON Body (for POST/PATCH) */}
          {(method === 'POST' || method === 'PATCH') && (
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">
                Payload JSON Body (POST / PATCH):
              </label>
              <textarea
                rows={6}
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                placeholder='{\n  "key": "value"\n}'
                className="w-full rounded-md border border-slate-800 bg-[#080C14] p-3 font-mono text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response Display */}
      {responseStatus !== null && (
        <Card className="border-slate-800 bg-[#0F172A] shadow-md">
          <CardHeader className="pb-3 border-b border-slate-800 flex flex-row items-center justify-between">
            <div className="flex items-center space-x-3">
              <CardTitle className="text-sm font-semibold text-white">
                Phản Hồi (Response)
              </CardTitle>
              <Badge
                variant="outline"
                className={`font-mono text-xs ${
                  responseStatus >= 200 && responseStatus < 300
                    ? 'border-emerald-800 text-emerald-400 bg-emerald-950/40'
                    : 'border-rose-800 text-rose-400 bg-rose-950/40'
                }`}
              >
                HTTP {responseStatus}
              </Badge>
              {latencyMs !== null && (
                <span className="font-mono text-slate-400 text-xs">{latencyMs} ms</span>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="text-xs text-slate-300 hover:text-white h-8 gap-1.5"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Đã chép' : 'Sao chép JSON'}</span>
            </Button>
          </CardHeader>

          <CardContent className="pt-4">
            <pre className="rounded-lg border border-slate-800 bg-[#080C14] p-4 font-mono text-xs text-slate-200 overflow-x-auto max-h-96">
              {JSON.stringify(responseData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
