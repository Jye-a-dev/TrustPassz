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
      <Card className={cn('border-slate-800 bg-[#0F172A] shadow-xl', className)}>
        <CardHeader className="border-b border-slate-800 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center space-x-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold text-white">
                  Biên Bản Đối Soát &amp; Phán Quyết Trọng Tài (Arbitration Audit)
                </CardTitle>
                <p className="text-[11px] text-slate-400">
                  Bắt buộc tối thiểu {MIN_NOTE_LENGTH} ký tự để mở khóa quyền can thiệp On-Chain.
                </p>
              </div>
            </div>

            {lastSavedTime && (
              <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                <Save className="h-3 w-3 text-cyan-400" />
                Đã tự động lưu nháp: {lastSavedTime}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left 2 Cols: Textarea & Char Counter */}
            <div className="lg:col-span-2 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="audit-resolution-note" className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <span>Ghi chú phán quyết (Resolution Audit Note):</span>
                  <span className="text-rose-400 font-mono">*</span>
                </label>
                <div className="flex items-center space-x-2">
                  <span
                    className={cn(
                      'font-mono text-[11px] font-semibold',
                      isSatisfied ? 'text-emerald-400' : 'text-amber-400'
                    )}
                  >
                    {trimmedLength}/{MIN_NOTE_LENGTH} ký tự
                    {!isSatisfied && ` (còn thiếu ${remaining})`}
                  </span>
                  {note && (
                    <button
                      type="button"
                      onClick={handleClearDraft}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      title="Xóa nháp"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <textarea
                id="audit-resolution-note"
                rows={5}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập chi tiết nhận định đối soát giữa cam kết ban đầu và bằng chứng khiếu nại (Tối thiểu 20 ký tự)..."
                className="w-full rounded-lg border border-slate-800 bg-[#080C14] p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-sans leading-relaxed resize-none"
              />

              {/* Progress track */}
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
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
            <div className="rounded-lg border border-slate-800 bg-[#080C14] p-3 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                    <Bot className="h-3.5 w-3.5 text-cyan-400" />
                    Lập luận của AI Arbitrator:
                  </span>
                  <Badge
                    variant={aiConfidence >= 0.75 ? 'emerald' : 'amber'}
                    className="text-[9px] font-mono py-0"
                  >
                    Conf {(aiConfidence * 100).toFixed(0)}%
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans line-clamp-4">
                  {dispute.aiExplanation ||
                    'AI sVLM kiểm định mã nguồn và ảnh crash, phát hiện vi phạm quy tắc cam kết không crash tại runtime.'}
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleQuoteAi}
                className="border-slate-800 bg-[#0F172A] hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 text-[10px] font-mono h-8 w-full gap-1"
              >
                <Quote className="h-3 w-3" />
                <span>Trích dẫn góc nhìn AI</span>
              </Button>
            </div>
          </div>

          {/* Action Decision Buttons with Tooltip Guard */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-3 border-t border-slate-800/80 gap-3">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>
                Thao tác phán quyết sẽ broadcast giao dịch On-Chain thông qua Oracle Relayer.
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Button 1: Payout to Seller */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      type="button"
                      size="sm"
                      disabled={!isSatisfied || isResolving}
                      onClick={() => handleTriggerAction('APPROVE_PAYOUT')}
                      className={cn(
                        'min-h-[44px] text-xs font-semibold gap-1.5 px-4 transition-all',
                        isSatisfied && !isResolving
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                      )}
                    >
                      {isResolving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      <span>Duyệt giải ngân cho Seller</span>
                    </Button>
                  </div>
                </TooltipTrigger>
                {!isSatisfied && (
                  <TooltipContent side="top">
                    Cần tối thiểu {MIN_NOTE_LENGTH} ký tự giải trình lý do trước khi kích hoạt
                  </TooltipContent>
                )}
              </Tooltip>

              {/* Button 2: Refund to Buyer */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      type="button"
                      size="sm"
                      disabled={!isSatisfied || isResolving}
                      onClick={() => handleTriggerAction('TRIGGER_REFUND')}
                      className={cn(
                        'min-h-[44px] text-xs font-semibold gap-1.5 px-4 transition-all',
                        isSatisfied && !isResolving
                          ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                      )}
                    >
                      {isResolving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                      <span>Duyệt hoàn tiền cho Buyer</span>
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
                className="min-h-[44px] border-slate-800 bg-[#0B0F17] hover:bg-slate-800 text-slate-200 text-xs font-medium gap-1.5 px-3"
              >
                <MessageSquarePlus className="h-4 w-4 text-cyan-400" />
                <span>Yêu cầu bổ sung</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

