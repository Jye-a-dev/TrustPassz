'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';

export interface PromptRuleScenario {
  id: string;
  name: string;
  category: 'CRASH' | 'KEY_DIE' | 'CREDENTIAL' | 'FALSE_AD' | 'FAKE_EVIDENCE';
  description: string;
  targetVerdict: 'TRIGGER_REFUND' | 'APPROVE_PAYOUT' | 'ESCALATE_TO_ADMIN';
  isActive: boolean;
}

const DEFAULT_SCENARIOS: PromptRuleScenario[] = [
  {
    id: 'sc-1',
    name: '1. Crash Runtime & Thiếu Dependency',
    category: 'CRASH',
    description:
      'Nếu ảnh bằng chứng hiển thị rõ ràng StackTrace uncaughtException, SegFault, ModuleNotFoundError hoặc npm exit code 1 mà trong cam kết nói chạy ổn định → TRIGGER_REFUND.',
    targetVerdict: 'TRIGGER_REFUND',
    isActive: true,
  },
  {
    id: 'sc-2',
    name: '2. License Key Die / Revoked',
    category: 'KEY_DIE',
    description:
      'Nếu màn hình kích hoạt thông báo "Key has been revoked" hoặc "Expired prior to SLA" và khớp với chuỗi key Seller bàn giao → TRIGGER_REFUND.',
    targetVerdict: 'TRIGGER_REFUND',
    isActive: true,
  },
  {
    id: 'sc-3',
    name: '3. Tài Khoản Sai Thông Tin (Invalid Credential)',
    category: 'CREDENTIAL',
    description:
      'Nếu Buyer cung cấp video hoặc ảnh 2FA / Login failed liên tục với credentials trong Digital Vault → TRIGGER_REFUND.',
    targetVerdict: 'TRIGGER_REFUND',
    isActive: true,
  },
  {
    id: 'sc-4',
    name: '4. Quảng Cáo Sai Lệch (False Advertisement)',
    category: 'FALSE_AD',
    description:
      'Nếu sản phẩm thực tế thiếu hơn 30% tính năng cốt lõi so với bản mô tả chi tiết của Seller → TRIGGER_REFUND.',
    targetVerdict: 'TRIGGER_REFUND',
    isActive: true,
  },
  {
    id: 'sc-5',
    name: '5. Bằng Chứng Giả Mạo (Fake Evidence / Fraud)',
    category: 'FAKE_EVIDENCE',
    description:
      'Nếu ảnh bằng chứng có dấu hiệu cắt ghép, font chữ terminal không đồng nhất, ngày giờ hệ điều hành không trùng khớp thời gian kiểm định → APPROVE_PAYOUT.',
    targetVerdict: 'APPROVE_PAYOUT',
    isActive: true,
  },
];

export function PromptScenarioEditor() {
  const [scenarios, setScenarios] = React.useState<PromptRuleScenario[]>(DEFAULT_SCENARIOS);

  const toggleActive = (id: string) => {
    setScenarios((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
    toast.success('Đã cập nhật trạng thái kích hoạt quy tắc.');
  };

  const getVerdictBadge = (verdict: PromptRuleScenario['targetVerdict']) => {
    switch (verdict) {
      case 'TRIGGER_REFUND':
        return 'border-rose-200 text-rose-700 bg-rose-50';
      case 'APPROVE_PAYOUT':
        return 'border-emerald-200 text-emerald-700 bg-emerald-50';
      default:
        return 'border-amber-200 text-amber-700 bg-amber-50';
    }
  };

  return (
    <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-2.5 gap-2">
        <div className="flex items-center space-x-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-xs font-bold text-slate-900">
              Context Rules &amp; 5 Kịch Bản Vi Phạm Trọng Tài
            </CardTitle>
            <p className="text-[11px] text-slate-400">
              Nhúng bộ quy tắc kiểm định vào System Prompt sVLM và Outlines FSM Regex
            </p>
          </div>
        </div>
        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700 text-xs w-fit font-mono">
          5 / 5 Kịch bản sẵn sàng
        </Badge>
      </div>

      <div className="space-y-3 pt-1">
        {scenarios.map((sc) => (
          <div
            key={sc.id}
            className={`rounded-lg border p-3.5 transition-colors ${
              sc.isActive
                ? 'border-slate-200 bg-slate-50'
                : 'border-slate-200 bg-slate-100/60 opacity-50'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-xs text-slate-900">{sc.name}</span>
                  <span className={`font-mono text-[9px] px-2 py-0.5 rounded-full border font-semibold ${getVerdictBadge(sc.targetVerdict)}`}>
                    Phán quyết: {sc.targetVerdict}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{sc.description}</p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleActive(sc.id)}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-mono border transition-colors shadow-2xs font-semibold ${
                    sc.isActive
                      ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                      : 'border-slate-200 text-slate-400 bg-white'
                  }`}
                >
                  {sc.isActive ? 'Active' : 'Disabled'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
