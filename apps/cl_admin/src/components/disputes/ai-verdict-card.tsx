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
          badge: 'border-emerald-800 text-emerald-400 bg-emerald-950/40',
          desc: 'Chứng cứ khiếu nại không đủ cơ sở hoặc sản phẩm hoạt động đúng cam kết ban đầu.',
        };
      case 'TRIGGER_REFUND':
        return {
          title: 'Đề Xuất AI: Hoàn Tiền Cho Buyer (TRIGGER_REFUND)',
          badge: 'border-rose-800 text-rose-400 bg-rose-950/40',
          desc: 'Phát hiện vi phạm hợp đồng kỹ thuật và lỗi nghiêm trọng từ tài sản của Seller.',
        };
      case 'ESCALATE_TO_ADMIN':
      default:
        return {
          title: 'Đề Xuất AI: Chuyển Giao Admin Thẩm Định (ESCALATE_TO_ADMIN)',
          badge: 'border-amber-800 text-amber-400 bg-amber-950/40',
          desc: 'Độ tin cậy dưới ngưỡng quy định (< 0.75), yêu cầu Trọng tài viên con người phân xử.',
        };
    }
  };

  const details = getVerdictDetails(verdict);

  return (
    <Card className="border-slate-800 bg-[#0F172A] shadow-lg">
      <CardHeader className="border-b border-slate-800 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-1.5">
                <span>Khung Đánh Giá AI Arbitrator (sVLM Engine)</span>
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              </CardTitle>
              <p className="text-[11px] text-slate-400">
                Model: Qwen2-VL-2B-Instruct • Outlines Structured Output Engine
              </p>
            </div>
          </div>

          <Badge variant="outline" className={`font-mono text-xs ${details.badge}`}>
            {details.title.split(':')[1]?.trim() || verdict}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4 text-xs">
        {/* Confidence Score Bar */}
        <div className="space-y-1.5 rounded-lg border border-slate-800 bg-[#080C14] p-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300">
              Chỉ số độ tin cậy AI (Confidence Score):
            </span>
            <span
              className={`font-mono font-bold text-sm ${
                isHighConfidence ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {(confidence * 100).toFixed(1)}% ({confidence.toFixed(4)})
            </span>
          </div>

          {/* Progress track */}
          <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              style={{ width: `${confidence * 100}%` }}
              className={`h-full rounded-full transition-all ${
                isHighConfidence ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0.00 (Không chắc chắn)</span>
            <span className="text-slate-400 font-semibold">Ngưỡng chuẩn: 0.75</span>
            <span>1.00 (Chắc chắn tuyệt đối)</span>
          </div>

          {!isHighConfidence && (
            <div className="mt-2 flex items-center space-x-1.5 text-amber-400 text-[11px] bg-amber-950/40 p-2 rounded border border-amber-800/40">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>
                Cảnh báo: Confidence &lt; 0.75. Hệ thống đã tự động kích hoạt hàng đợi ESCALATE_TO_ADMIN.
              </span>
            </div>
          )}
        </div>

        {/* Reasoning Summary */}
        <div className="space-y-1.5">
          <span className="font-semibold text-slate-300">
            Tóm tắt giải trình suy luận (Reasoning Summary):
          </span>
          <div className="rounded-lg border border-slate-800 bg-[#080C14] p-3 text-slate-300 leading-relaxed font-sans">
            {reasoning}
          </div>
        </div>

        {/* Violated Rules List */}
        <div className="space-y-1.5">
          <span className="font-semibold text-slate-300">
            Danh sách điều khoản / kịch bản vi phạm phát hiện:
          </span>
          <div className="space-y-1.5">
            {violatedRules.map((rule, idx) => (
              <div
                key={idx}
                className="flex items-center space-x-2 rounded-md border border-rose-900/40 bg-rose-950/20 px-3 py-2 text-rose-300 text-xs"
              >
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
