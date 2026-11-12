'use client';

import * as React from 'react';
import { Bot, AlertTriangle, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ArbitrationVerdict, DisputeLog } from '@/types';

interface AiVerdictCardProps {
  dispute: DisputeLog;
}

export function AiVerdictCard({ dispute }: AiVerdictCardProps) {
  const verdict: ArbitrationVerdict = dispute.aiVerdict || 'TRIGGER_REFUND';
  const confidence = dispute.aiConfidenceScore ?? 0.88;
  const isHighConfidence = confidence >= 0.75;

  const reasoning =
    dispute.aiExplanation ||
    'AI sVLM Qwen2-VL phân tích ảnh chụp màn hình unbox và phát hiện crash nghiêm trọng "TypeError: Cannot read properties of undefined (reading privateKey)" tại entrypoint. Sản phẩm không thể khởi động theo đúng cam kết trong cam kết kỹ thuật của Seller.';

  const violatedRules = [
    'R-01: Runtime Crash - Mã nguồn không thực thi được ở môi trường chuẩn Node 20',
    'R-04: False Advertisement - Cam kết mã nguồn không lỗi nhưng có exception nghiêm trọng',
  ];

  const getVerdictDetails = (v: ArbitrationVerdict) => {
    switch (v) {
      case 'APPROVE_PAYOUT':
        return {
          title: 'Đề Xuất AI: Duyệt Giải Ngân (APPROVE_PAYOUT)',
          badge: 'border-emerald-200 text-emerald-700 bg-emerald-50',
          desc: 'Chứng cứ khiếu nại không đủ cơ sở hoặc sản phẩm hoạt động đúng cam kết ban đầu.',
        };
      case 'TRIGGER_REFUND':
        return {
          title: 'Đề Xuất AI: Hoàn Tiền Cho Buyer (TRIGGER_REFUND)',
          badge: 'border-rose-200 text-rose-700 bg-rose-50',
          desc: 'Phát hiện vi phạm hợp đồng kỹ thuật và lỗi nghiêm trọng từ tài sản của Seller.',
        };
      case 'ESCALATE_TO_ADMIN':
      default:
        return {
          title: 'Đề Xuất AI: Chuyển Giao Admin Thẩm Định (ESCALATE_TO_ADMIN)',
          badge: 'border-amber-200 text-amber-700 bg-amber-50',
          desc: 'Độ tin cậy dưới ngưỡng quy định (< 0.75), yêu cầu Trọng tài viên con người phân xử.',
        };
    }
  };

  const details = getVerdictDetails(verdict);

  return (
    <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">AI Verdict Console (sVLM Qwen2-VL Model)</h3>
            <p className="text-[11px] text-slate-400 font-mono">Outlines Structured JSON FSM Guardrails</p>
          </div>
        </div>
        <span className={`rounded-full border font-mono text-xs px-2.5 py-0.5 font-semibold ${details.badge}`}>
          {details.title.split(':')[1]?.trim() || verdict}
        </span>
      </div>

      <div className="space-y-4 text-xs">
        {/* Confidence Score Bar */}
        <div className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs">
          <div className="flex items-center justify-between font-mono">
            <span className="font-semibold text-slate-700">
              Chỉ số độ tin cậy AI:
            </span>
            <span
              className={`font-mono font-bold tabular-nums ${
                isHighConfidence ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {(confidence * 100).toFixed(1)}% ({confidence.toFixed(4)})
            </span>
          </div>

          {/* Progress track */}
          <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              style={{ width: `${confidence * 100}%` }}
              className={`h-full rounded-full transition-all ${
                isHighConfidence ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>0.00 (Không chắc)</span>
            <span className="text-amber-700 font-semibold">Ngưỡng chuẩn Admin: 0.75</span>
            <span>1.00 (Tuyệt đối)</span>
          </div>

          {!isHighConfidence && (
            <div className="mt-2 flex items-center space-x-1.5 text-amber-700 text-[11px] bg-amber-50 p-2 rounded border border-amber-200">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>
                Cảnh báo: Confidence &lt; 0.75. Hệ thống đã tự động kích hoạt hàng đợi ESCALATE_TO_ADMIN.
              </span>
            </div>
          )}
        </div>

        {/* Reasoning Summary */}
        <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 leading-relaxed">
          <strong className="text-slate-800">Tóm tắt suy luận sVLM:</strong> {reasoning}
        </div>

        {/* Violated Rules List */}
        <div className="space-y-1.5">
          <span className="font-semibold text-slate-700">
            Danh sách điều khoản / kịch bản vi phạm phát hiện:
          </span>
          <div className="space-y-1.5">
            {violatedRules.map((rule, idx) => (
              <div
                key={idx}
                className="flex items-center space-x-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 text-xs"
              >
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
