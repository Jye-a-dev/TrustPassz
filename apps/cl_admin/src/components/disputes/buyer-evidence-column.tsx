'use client';

import * as React from 'react';
import { AlertTriangle, Video, FileText, Maximize2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    <Card className={cn('border-slate-800 bg-[#0F172A] shadow-lg flex flex-col', className)}>
      <CardHeader className="border-b border-slate-800 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-950/60 text-amber-400 border border-amber-800/40">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-semibold text-white">
              Cột Phải: Bằng Chứng Khiếu Nại của Buyer
            </CardTitle>
          </div>
          <Badge variant="outline" className="border-amber-800 bg-amber-950/40 text-amber-400 text-[10px] font-mono">
            Dispute Evidence
          </Badge>
        </div>
      </CardHeader>

      <CardContent
        ref={scrollRef}
        onScroll={onScroll}
        className="space-y-4 pt-4 flex-1 max-h-[580px] overflow-y-auto"
      >
        {/* Buyer Claim */}
        <div className="space-y-1 text-xs">
          <span className="font-semibold text-slate-300">Lý do khiếu nại (Buyer Claim):</span>
          <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-amber-200 leading-relaxed text-xs">
            &ldquo;{dispute.reason}&rdquo;
          </div>
        </div>

        {/* 3 Unboxing Keyframes */}
        <div className="space-y-2 text-xs">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Video className="h-4 w-4 text-cyan-400" />
            3 Keyframes Unbox trích xuất từ Video:
          </span>
          <div className="grid grid-cols-3 gap-2">
            {unboxKeyframes.map((kf, idx) => (
              <div
                key={idx}
                onClick={() =>
                  onSelectImage({ src: kf.url, title: `Keyframe ${kf.time}: ${kf.label}` })
                }
                className="group relative cursor-pointer overflow-hidden rounded-lg border border-slate-800 bg-[#080C14] p-1.5 transition-all hover:border-cyan-500/50"
              >
                <div className="relative h-20 w-full overflow-hidden rounded bg-slate-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getMediaUrl(kf.url)}
                    alt={kf.label}
                    onLoad={() => markAsLoaded(kf.url)}
                    className={cn(
                      'h-full w-full object-cover transition-opacity duration-300 group-hover:scale-105',
                      loadedMap[kf.url] ? 'opacity-100' : 'opacity-40 blur-xs'
                    )}
                    style={{ backgroundImage: `url(${blurPlaceholder})` }}
                  />
                  <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.2 font-mono text-[9px] text-cyan-300">
                    {kf.time}
                  </span>
                </div>
                <p className="mt-1 font-mono text-[10px] text-slate-300 truncate">{kf.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Error Screenshots */}
        <div className="space-y-2 text-xs">
          <span className="font-semibold text-slate-300 flex items-center justify-between">
            <span>Ảnh chụp màn hình lỗi (Supabase Storage):</span>
            <span className="text-[10px] text-slate-500">Click để soi phóng đại</span>
          </span>
          <div className="grid grid-cols-2 gap-3">
            {buyerScreenshots.map((scr, idx) => {
              const mediaUrl = getMediaUrl(scr);
              return (
                <div
                  key={idx}
                  onClick={() => onSelectImage({ src: mediaUrl, title: `Ảnh lỗi ${idx + 1}` })}
                  className="group relative cursor-pointer rounded-lg border border-slate-800 bg-[#080C14] p-2 transition-all hover:border-cyan-500/50"
                >
                  <div className="h-28 w-full rounded bg-slate-900 flex flex-col items-center justify-center text-slate-500 border border-slate-800 text-[11px] gap-1 group-hover:bg-slate-800/60">
                    <FileText className="h-6 w-6 text-rose-400" />
                    <span className="font-mono text-[10px] text-slate-300 truncate max-w-[140px]">
                      evidence_{idx + 1}.png
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">Supabase Storage</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Chi tiết lỗi #{idx + 1}</span>
                    <span className="text-cyan-400 group-hover:underline flex items-center gap-0.5">
                      <Maximize2 className="h-3 w-3" /> Phóng to
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Raw Terminal Log with PII mask */}
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300">Raw Terminal / Exception Log:</span>
            {isPiiUnlocked && (
              <Badge variant="amber" className="text-[9px] font-mono py-0">
                PII ĐÃ MỞ KHÓA
              </Badge>
            )}
          </div>
          <pre className="rounded-lg border border-slate-800 bg-[#080C14] p-3 text-[10px] font-mono text-rose-300 overflow-x-auto max-h-36 leading-relaxed">
            {isPiiUnlocked ? rawLogs : redactedLogs}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

