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
        return 'border-emerald-200 text-emerald-700 bg-emerald-50';
      case 'POST':
        return 'border-cyan-200 text-cyan-700 bg-cyan-50';
      case 'PATCH':
        return 'border-amber-200 text-amber-700 bg-amber-50';
      case 'DELETE':
        return 'border-rose-200 text-rose-700 bg-rose-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="text-slate-500 hover:text-slate-800 transition-colors">Hạ Tầng</span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-900 font-semibold">Super API Explorer</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleExecute}
            disabled={isLoading}
            className="h-8.5 px-3.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs gap-1.5 shadow-2xs"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Play className="h-4 w-4 text-white" />}
            <span>Send Request</span>
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-base font-bold text-slate-900">Super API Explorer &amp; REST Console</h2>
        <p className="text-xs text-slate-500">
          Kiểm thử trực tiếp các endpoint RESTful `/api/v1/*` của Backend NestJS (:3001) với JWT Admin.
        </p>
      </div>

      {/* Preset Quick Selectors */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs space-y-2 shadow-xs">
        <span className="font-semibold text-slate-700">Quick Presets (Các mẫu yêu cầu thường dùng):</span>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(p)}
              className="rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 text-[11px] text-slate-700 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <span className={`font-mono font-bold text-[9px] px-1.5 py-0.5 rounded border ${getMethodBadgeClass(p.method)}`}>
                {p.method}
              </span>
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Query Request Builder */}
      <Card className="rounded-xl border border-slate-200 bg-white shadow-xs p-5 space-y-4">
        <div className="pb-3 border-b border-slate-100">
          <CardTitle className="text-xs font-bold text-slate-900">
            Bộ Soạn Thảo Yêu Cầu (Request Builder)
          </CardTitle>
        </div>
        <div className="space-y-4 text-xs">
          {/* Method and Endpoint Input */}
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as HttpMethod)}
              className="w-full sm:w-32 h-9.5 rounded-lg border border-slate-200 bg-white px-3 font-mono text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-400"
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
              className="flex-1 font-mono text-xs border-slate-200 bg-slate-50 text-slate-900 h-9.5 focus:bg-white"
            />
          </div>

          {/* JSON Body (for POST/PATCH) */}
          {(method === 'POST' || method === 'PATCH') && (
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">
                Payload JSON Body (POST / PATCH):
              </label>
              <textarea
                rows={6}
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                placeholder='{\n  "key": "value"\n}'
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white leading-relaxed"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Response Display */}
      {responseStatus !== null && (
        <Card className="rounded-xl border border-slate-200 bg-white shadow-xs p-5 space-y-3">
          <div className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center space-x-3">
              <CardTitle className="text-xs font-bold text-slate-900">
                Phản Hồi (Response)
              </CardTitle>
              <span
                className={`font-mono text-xs px-2 py-0.5 rounded-full border font-semibold ${
                  responseStatus >= 200 && responseStatus < 300
                    ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                    : 'border-rose-200 text-rose-700 bg-rose-50'
                }`}
              >
                HTTP {responseStatus}
              </span>
              {latencyMs !== null && (
                <span className="font-mono text-slate-500 text-xs tabular-nums">{latencyMs} ms</span>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-700 h-8 gap-1.5 shadow-2xs font-medium"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
              <span>{copied ? 'Đã chép' : 'Sao chép JSON'}</span>
            </Button>
          </div>

          <div className="pt-1">
            <pre className="rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-800 overflow-x-auto max-h-96 leading-relaxed">
              {JSON.stringify(responseData, null, 2)}
            </pre>
          </div>
        </Card>
      )}
    </div>
  );
}
