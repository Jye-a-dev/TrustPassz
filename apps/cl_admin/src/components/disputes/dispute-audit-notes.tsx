'use client';

import * as React from 'react';
import {
  FileText,
  Bot,
  Save,
  Trash2,
  CheckCircle2,
  RotateCcw,
  MessageSquarePlus,
  AlertCircle,
  Quote,
  Loader2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Deal, DisputeLog, ArbitrationVerdict } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DisputeAuditNotesProps {
  deal: Deal;
  dispute: DisputeLog;
  onResolve: (action: ArbitrationVerdict | 'REQUEST_EVIDENCE', note: string) => Promise<void>;
  isResolving?: boolean;
  className?: string;
}

const MIN_NOTE_LENGTH = 20;

export function DisputeAuditNotes({
  deal,
  dispute,
  onResolve,
  isResolving = false,
  className,
}: DisputeAuditNotesProps) {
  const storageKey = React.useMemo(() => `trustpassz_audit_draft_${deal.id}`, [deal.id]);
  const [note, setNote] = React.useState('');
  const [lastSavedTime, setLastSavedTime] = React.useState<string | null>(null);

  // Load draft from localStorage on mount
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.resolutionNote) {
          setNote(parsed.resolutionNote);
          if (parsed.lastSavedAt) {
            setLastSavedTime(new Date(parsed.lastSavedAt).toLocaleTimeString('vi-VN'));
          }
        }
      }
    } catch {
      // ignore JSON parse error
    }
  }, [storageKey]);

  // Auto-save draft on note change
  React.useEffect(() => {
    if (!note.trim()) return;
    const timeout = setTimeout(() => {
      try {
        const now = new Date();
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            dealId: deal.id,
            disputeId: dispute.id,
            resolutionNote: note,
            lastSavedAt: now.toISOString(),
          })
        );
        setLastSavedTime(now.toLocaleTimeString('vi-VN'));
      } catch {
        // ignore localStorage errors
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [note, storageKey, deal.id, dispute.id]);

  const handleClearDraft = () => {
    try {
      localStorage.removeItem(storageKey);
      setNote('');
      setLastSavedTime(null);
      toast.info('Đã xóa bản nháp ghi chú đối soát.');
    } catch {
      // ignore
    }
  };

  const handleQuoteAi = () => {
    const aiText = dispute.aiExplanation || 'AI ghi nhận vi phạm tiêu chuẩn kỹ thuật.';
    const formatted = `[Trích xuất sVLM]: ${aiText}\n[Kết luận Trọng tài]: `;
    setNote((prev) => (prev ? `${prev}\n\n${formatted}` : formatted));
    toast.success('Đã đưa tóm tắt AI vào khung ghi chú.');
  };

  const trimmedLength = note.trim().length;
  const isSatisfied = trimmedLength >= MIN_NOTE_LENGTH;
  const remaining = MIN_NOTE_LENGTH - trimmedLength;

  const handleTriggerAction = async (action: ArbitrationVerdict | 'REQUEST_EVIDENCE') => {
    if (action !== 'REQUEST_EVIDENCE' && !isSatisfied) {
      toast.error(`Vui lòng nhập tối thiểu ${MIN_NOTE_LENGTH} ký tự giải trình lý do đối soát.`);
      return;
    }
    await onResolve(action, note.trim());
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  };

  const aiConfidence = dispute.aiConfidenceScore ?? 0.85;

  return (
    <TooltipProvider>
      <Card className={cn('rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3', className)}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-2.5 gap-2">
          <div className="flex items-center space-x-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-xs font-bold text-slate-900">
                Biên Bản Thẩm Định &amp; Quyết Định Phán Quyết Trọng Tài
              </CardTitle>
              <p className="text-[11px] text-slate-400">
                Bắt buộc tối thiểu {MIN_NOTE_LENGTH} ký tự để mở khóa quyền can thiệp On-Chain.
              </p>
            </div>
          </div>

          {lastSavedTime && (
            <span className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
              <Save className="h-3 w-3 text-slate-600" />
              Đã tự động lưu nháp: {lastSavedTime}
            </span>
          )}
        </div>

        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left 2 Cols: Textarea & Char Counter */}
            <div className="lg:col-span-2 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="audit-resolution-note" className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span>Biên bản giải trình kiểm toán (Bắt buộc):</span>
                  <span className="text-rose-500 font-mono">*</span>
                </label>
                <div className="flex items-center space-x-2">
                  <span
                    className={cn(
                      'font-mono text-[11px] font-semibold',
                      isSatisfied ? 'text-emerald-700' : 'text-amber-700'
                    )}
                  >
                    {trimmedLength}/{MIN_NOTE_LENGTH} ký tự
                    {!isSatisfied && ` (còn thiếu ${remaining})`}
                  </span>
                  {note && (
                    <button
                      type="button"
                      onClick={handleClearDraft}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      title="Xóa nháp"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <textarea
                id="audit-resolution-note"
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập chi tiết nhận định đối soát giữa cam kết ban đầu và bằng chứng khiếu nại (Tối thiểu 20 ký tự)..."
                className="w-full rounded-lg border border-slate-300 bg-white p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 font-sans leading-relaxed resize-none"
              />

              {/* Progress track */}
              <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, (trimmedLength / MIN_NOTE_LENGTH) * 100)}%` }}
                  className={cn(
                    'h-full transition-all duration-300',
                    isSatisfied ? 'bg-emerald-500' : 'bg-amber-500'
                  )}
                />
              </div>
            </div>

            {/* Right 1 Col: AI Explanation Summary Box */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                    <Bot className="h-3.5 w-3.5 text-slate-600" />
                    Lập luận của AI Arbitrator:
                  </span>
                  <Badge
                    variant={aiConfidence >= 0.75 ? 'emerald' : 'amber'}
                    className="text-[9px] font-mono py-0"
                  >
                    Conf {(aiConfidence * 100).toFixed(0)}%
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-sans line-clamp-4">
                  {dispute.aiExplanation ||
                    'AI sVLM kiểm định mã nguồn và ảnh crash, phát hiện vi phạm quy tắc cam kết không crash tại runtime.'}
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleQuoteAi}
                className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-mono h-8 w-full gap-1 shadow-2xs"
              >
                <Quote className="h-3 w-3" />
                <span>Trích dẫn góc nhìn AI</span>
              </Button>
            </div>
          </div>

          {/* Action Decision Buttons with Tooltip Guard */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-3 border-t border-slate-100 gap-3">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>
                Thao tác phán quyết sẽ broadcast giao dịch On-Chain thông qua Oracle Relayer.
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Button 1: Refund to Buyer */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      type="button"
                      size="sm"
                      disabled={!isSatisfied || isResolving}
                      onClick={() => handleTriggerAction('TRIGGER_REFUND')}
                      className={cn(
                        'min-h-[40px] text-xs font-semibold gap-1.5 px-4 transition-all shadow-xs',
                        isSatisfied && !isResolving
                          ? 'bg-rose-600 hover:bg-rose-500 text-white'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                      )}
                    >
                      {isResolving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                      <span>Duyệt Hoàn Tiền Cho Buyer (Refund)</span>
                    </Button>
                  </div>
                </TooltipTrigger>
                {!isSatisfied && (
                  <TooltipContent side="top">
                    Cần tối thiểu {MIN_NOTE_LENGTH} ký tự giải trình lý do trước khi kích hoạt
                  </TooltipContent>
                )}
              </Tooltip>

              {/* Button 2: Payout to Seller */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      type="button"
                      size="sm"
                      disabled={!isSatisfied || isResolving}
                      onClick={() => handleTriggerAction('APPROVE_PAYOUT')}
                      className={cn(
                        'min-h-[40px] text-xs font-semibold gap-1.5 px-4 transition-all shadow-xs',
                        isSatisfied && !isResolving
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                      )}
                    >
                      {isResolving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      <span>Duyệt Giải Ngân Cho Seller (Settle)</span>
                    </Button>
                  </div>
                </TooltipTrigger>
                {!isSatisfied && (
                  <TooltipContent side="top">
                    Cần tối thiểu {MIN_NOTE_LENGTH} ký tự giải trình lý do trước khi kích hoạt
                  </TooltipContent>
                )}
              </Tooltip>

              {/* Button 3: Request Additional Evidence */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isResolving}
                onClick={() => handleTriggerAction('REQUEST_EVIDENCE')}
                className="min-h-[40px] border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium gap-1.5 px-3 shadow-2xs"
              >
                <MessageSquarePlus className="h-4 w-4 text-slate-500" />
                <span>Yêu Cầu Bổ Sung Chứng Cứ (24h)</span>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
}

