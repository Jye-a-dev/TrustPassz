'use client';

import * as React from 'react';
import { AlertTriangle, Video } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useOptimizedEvidence } from '@/hooks/use-optimized-evidence';
import { cn } from '@/lib/utils';
import type { DisputeLog } from '@/types';

interface BuyerEvidenceColumnProps {
  dispute: DisputeLog;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  isPiiUnlocked: boolean;
  rawLogs: string;
  redactedLogs: string;
  onSelectImage: (target: { src: string; title: string }) => void;
  className?: string;
}

export function BuyerEvidenceColumn({
  dispute,
  scrollRef,
  onScroll,
  isPiiUnlocked,
  rawLogs,
  redactedLogs,
  onSelectImage,
  className,
}: BuyerEvidenceColumnProps) {
  const { getMediaUrl, markAsLoaded, loadedMap, blurPlaceholder } = useOptimizedEvidence();

  const buyerScreenshots =
    dispute.evidenceUrls && dispute.evidenceUrls.length > 0
      ? dispute.evidenceUrls
      : [
          '/images/evidence/runtime_error_log.png',
          '/images/evidence/terminal_fail_output.png',
        ];

  const unboxKeyframes = [
    {
      time: '00:04',
      label: 'Mở gói tài sản số',
      url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
    },
    {
      time: '00:18',
      label: 'Thực thi mã nguồn',
      url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
    },
    {
      time: '00:42',
      label: 'Phát hiện Exception',
      url: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=600&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <Card className={cn('rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3 flex flex-col h-105', className)}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
          <AlertTriangle className="size-4.5 text-rose-600" />
          Bằng Chứng Khiếu Nại Của Buyer
        </span>
        <span className="rounded bg-rose-50 text-rose-700 px-2 py-0.5 text-[10px] font-mono border border-rose-200">
          Dispute Evidence
        </span>
      </div>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="space-y-3 flex-1 overflow-y-auto scrollbar-thin text-xs"
      >
        {/* Buyer Claim */}
        <div className="space-y-1">
          <span className="font-semibold text-slate-700 text-xs">Lý do khiếu nại (Buyer Claim):</span>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 leading-relaxed text-xs">
            &ldquo;{dispute.reason}&rdquo;
          </div>
        </div>

        {/* 3 Unboxing Keyframes */}
        <div className="space-y-2 text-xs">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Video className="h-4 w-4 text-slate-600" />
            3 Keyframes Unbox trích xuất từ Video:
          </span>
          <div className="grid grid-cols-3 gap-2">
            {unboxKeyframes.map((kf, idx) => (
              <div
                key={idx}
                className="group relative cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                onClick={() => onSelectImage({ src: kf.url, title: `Unbox Video: ${kf.label} (${kf.time})` })}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={kf.url}
                  alt={kf.label}
                  className="h-16 w-full object-cover transition-transform group-hover:scale-105"
                />
                <span className="absolute bottom-1 right-1 rounded bg-slate-900/80 px-1 py-0.2 font-mono text-[9px] text-white">
                  {kf.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Terminal log output */}
        <div className="space-y-1.5 text-xs">
          <span className="font-semibold text-slate-700 block">
            Nhật ký thực thi (Terminal / Stacktrace Output):
          </span>
          <div className="rounded-lg border border-slate-200 bg-[#F1F5F9] p-3 font-mono text-[11px] text-slate-800 space-y-1 overflow-x-auto max-h-[160px] scrollbar-thin">
            <pre className="whitespace-pre-wrap font-mono">
              {isPiiUnlocked ? rawLogs : redactedLogs}
            </pre>
          </div>
        </div>

        {/* Raw Screenshots */}
        {buyerScreenshots.length > 0 && (
          <div className="space-y-2 text-xs">
            <span className="font-semibold text-slate-700">Ảnh chụp màn hình lỗi (Screenshots):</span>
            <div className="grid grid-cols-2 gap-2">
              {buyerScreenshots.map((url, idx) => (
                <div
                  key={idx}
                  className="relative rounded-lg border border-slate-200 bg-slate-100 p-2 text-center cursor-pointer group"
                  onClick={() =>
                    onSelectImage({
                      src: getMediaUrl(url),
                      title: `Bằng chứng Buyer #${idx + 1}`,
                    })
                  }
                >
                  <div className="h-24 bg-slate-900 rounded-md flex items-center justify-center text-slate-300 font-mono text-xs overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={loadedMap[url] ? getMediaUrl(url) : blurPlaceholder}
                      alt={`Evidence ${idx + 1}`}
                      onLoad={() => markAsLoaded(url)}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-2 py-1 bg-white text-slate-900 rounded border border-slate-200 text-[11px] font-medium shadow-xs">
                        Soi Canvas 3x
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
