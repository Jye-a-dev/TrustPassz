"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileQuestion,
  Film,
  Image as ImageIcon,
  ShieldAlert,
} from "lucide-react";

export interface EvidenceGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  evidenceUrls: string[];
  dealTitle?: string;
  initialIndex?: number;
}

function isVideoUrl(url: string): boolean {
  const clean = url.split("?")[0].toLowerCase();
  return (
    clean.endsWith(".mp4") ||
    clean.endsWith(".webm") ||
    clean.endsWith(".mov") ||
    clean.endsWith(".ogg") ||
    url.includes("video")
  );
}

function extractFilename(url: string, index: number): string {
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split("/");
    const last = parts[parts.length - 1];
    return decodeURIComponent(last) || `Chung-tu-${index + 1}`;
  } catch {
    return `Chung-tu-${index + 1}`;
  }
}

export function EvidenceGalleryModal({
  isOpen,
  onClose,
  evidenceUrls,
  dealTitle = "Kèo giao dịch",
  initialIndex = 0,
}: EvidenceGalleryModalProps) {
  const [activeIndex, setActiveIndex] = React.useState(initialIndex);
  const [loadError, setLoadError] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setActiveIndex(Math.min(Math.max(initialIndex, 0), Math.max(evidenceUrls.length - 1, 0)));
      setLoadError(false);
    }
  }, [isOpen, initialIndex, evidenceUrls.length]);

  const currentUrl = evidenceUrls[activeIndex] || "";
  const isVideo = isVideoUrl(currentUrl);
  const total = evidenceUrls.length;
  const currentFilename = extractFilename(currentUrl, activeIndex);

  const handlePrev = React.useCallback(() => {
    setLoadError(false);
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
  }, [total]);

  const handleNext = React.useCallback(() => {
    setLoadError(false);
    setActiveIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
  }, [total]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    },
    [handlePrev, handleNext]
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        onKeyDown={handleKeyDown}
        className="max-w-4xl w-[95vw] border border-slate-200 bg-white text-slate-800 p-0 overflow-hidden shadow-2xl rounded-2xl sm:rounded-3xl"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
              <ShieldAlert className="size-5 text-rose-600" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                Hồ sơ chứng cứ đối soát
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 font-mono font-bold shadow-2xs">
                  {total > 0 ? `${activeIndex + 1} / ${total}` : "0"}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 truncate max-w-xs sm:max-w-md font-medium">
                {dealTitle}
              </DialogDescription>
            </div>
          </div>

          {currentUrl && (
            <div className="flex items-center gap-2 pr-6">
              <a
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center min-h-11 min-w-11 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 border border-slate-300 hover:border-slate-400 shadow-sm transition-colors"
                title="Mở tab mới"
              >
                <ExternalLink className="size-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Mở gốc</span>
              </a>
              <a
                href={currentUrl}
                download={currentFilename}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center min-h-11 min-w-11 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold text-emerald-800 border border-emerald-300 shadow-sm transition-colors"
                title="Tải về"
              >
                <Download className="size-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Tải về</span>
              </a>
            </div>
          )}
        </div>

        {/* Media Viewer Area */}
        <div className="relative min-h-[320px] sm:min-h-[460px] max-h-[65vh] bg-slate-950 flex items-center justify-center p-2 sm:p-4 select-none">
          {total === 0 ? (
            <div className="flex flex-col items-center justify-center text-slate-400 gap-2 p-8">
              <FileQuestion className="size-10 text-slate-500" />
              <p className="text-sm">Không tìm thấy tài liệu chứng cứ nào trong khiếu nại này.</p>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center text-slate-300 gap-3 p-8 text-center">
              <ShieldAlert className="size-10 text-rose-500" />
              <p className="text-sm font-medium text-white">Không thể tải tệp tin chứng cứ trực tiếp</p>
              <p className="text-xs text-slate-400 max-w-sm truncate">{currentUrl}</p>
              <a
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-11 px-4 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 flex items-center gap-1.5 shadow-sm"
              >
                <ExternalLink className="size-3.5" />
                Xem trực tiếp trên Storage
              </a>
            </div>
          ) : isVideo ? (
            <video
              key={currentUrl}
              src={currentUrl}
              controls
              playsInline
              onError={() => setLoadError(true)}
              className="max-h-[60vh] max-w-full rounded-lg border border-slate-800 shadow-lg object-contain bg-black"
            />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={currentUrl}
              src={currentUrl}
              alt={currentFilename}
              onError={() => setLoadError(true)}
              className="max-h-[60vh] max-w-full rounded-lg border border-slate-800 shadow-lg object-contain"
            />
          )}

          {/* Navigation Overlay Buttons */}
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Chứng cứ trước"
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 min-h-11 min-w-11 rounded-full bg-white/90 hover:bg-white border border-slate-300 text-slate-800 flex items-center justify-center backdrop-blur-md transition-transform active:scale-95 cursor-pointer shadow-lg hover:border-slate-400"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Chứng cứ tiếp theo"
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 min-h-11 min-w-11 rounded-full bg-white/90 hover:bg-white border border-slate-300 text-slate-800 flex items-center justify-center backdrop-blur-md transition-transform active:scale-95 cursor-pointer shadow-lg hover:border-slate-400"
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails Footer Strip */}
        {total > 1 && (
          <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-2 overflow-x-auto scrollbar-thin">
            {evidenceUrls.map((url, idx) => {
              const active = idx === activeIndex;
              const isVid = isVideoUrl(url);
              return (
                <button
                  key={`${url}-${idx}`}
                  type="button"
                  onClick={() => {
                    setLoadError(false);
                    setActiveIndex(idx);
                  }}
                  className={`min-h-11 min-w-14 h-14 w-20 rounded-xl overflow-hidden border-2 relative shrink-0 transition-all cursor-pointer ${
                    active
                      ? "border-rose-500 ring-2 ring-rose-500/30 shadow-md"
                      : "border-slate-200 opacity-70 hover:opacity-100 hover:border-slate-300 bg-white"
                  }`}
                  aria-label={`Chọn chứng cứ ${idx + 1}`}
                >
                  {isVid ? (
                    <div className="size-full bg-slate-900 flex flex-col items-center justify-center gap-0.5 text-slate-400">
                      <Film className="size-4 text-emerald-400" />
                      <span className="text-[9px] uppercase font-mono font-bold">Video</span>
                    </div>
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={url}
                      alt={`Thumb ${idx + 1}`}
                      className="size-full object-cover bg-slate-900"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = "none";
                      }}
                    />
                  )}
                  {active && (
                    <span className="absolute bottom-0 inset-x-0 h-1 bg-rose-500" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

