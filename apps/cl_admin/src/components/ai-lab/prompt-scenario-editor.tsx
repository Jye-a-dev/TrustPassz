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
        return 'border-rose-800 text-rose-400 bg-rose-950/40';
      case 'APPROVE_PAYOUT':
        return 'border-emerald-800 text-emerald-400 bg-emerald-950/40';
      default:
        return 'border-amber-800 text-amber-400 bg-amber-950/40';
    }
  };

  return (
    <Card className="border-slate-800 bg-[#0F172A] shadow-md">
      <CardHeader className="border-b border-slate-800 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-white">
                Context Rules & 5 Kịch Bản Vi Phạm Trọng Tài
              </CardTitle>
              <p className="text-[11px] text-slate-400">
                Nhúng bộ quy tắc kiểm định vào System Prompt sVLM và Outlines FSM Regex
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-cyan-800 text-cyan-400 text-xs w-fit">
            5 / 5 Kịch bản sẵn sàng
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-4">
        {scenarios.map((sc) => (
          <div
            key={sc.id}
            className={`rounded-lg border p-3 transition-colors ${
              sc.isActive
                ? 'border-slate-800 bg-[#080C14]'
                : 'border-slate-900 bg-slate-950/40 opacity-50'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-xs text-white">{sc.name}</span>
                  <Badge variant="outline" className={`font-mono text-[9px] ${getVerdictBadge(sc.targetVerdict)}`}>
                    Phán quyết: {sc.targetVerdict}
                  </Badge>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{sc.description}</p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => toggleActive(sc.id)}
                  className={`rounded px-2.5 py-1 text-[11px] font-mono border transition-colors ${
                    sc.isActive
                      ? 'border-emerald-800 text-emerald-400 bg-emerald-950/30'
                      : 'border-slate-800 text-slate-500 bg-slate-900'
                  }`}
                >
                  {sc.isActive ? 'Active' : 'Disabled'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
