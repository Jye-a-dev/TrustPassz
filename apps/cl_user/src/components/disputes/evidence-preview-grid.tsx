"use client";

import * as React from "react";
import Image from "next/image";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  FileQuestion,
  Film,
  Image as ImageIcon,
  Loader2,
  Trash2,
  X,
  ZoomIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EvidenceFileItem } from "@/types/evidence-upload";

export interface EvidencePreviewGridProps {
  files: EvidenceFileItem[];
  onRemove: (id: string) => void;
  disabled?: boolean;
  className?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function EvidencePreviewGrid({
  files,
  onRemove,
  disabled = false,
  className = "",
}: EvidencePreviewGridProps) {
  const [activePreview, setActivePreview] = React.useState<EvidenceFileItem | null>(null);

  if (files.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
        <span className="font-medium">Danh sách bằng chứng đã đính kèm ({files.length}/5)</span>
        <span className="text-slate-400">Bấm vào tệp để xem trước</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {files.map((item) => {
          const isVideo = item.type === "video";
          const displayThumbnail = item.thumbnailUrl || (isVideo ? "" : item.previewUrl);

          return (
            <div
              key={item.id}
              className={cn(
                "group relative flex flex-col justify-between overflow-hidden rounded-2xl",
                "bg-white border border-slate-200 transition-all duration-200 shadow-sm",
                "hover:border-slate-300 hover:shadow-md"
              )}
            >
              {/* Media Preview Container */}
              <div
                role="button"
                tabIndex={0}
                aria-label={`Xem trước ${item.name}`}
                onClick={() => setActivePreview(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActivePreview(item);
                  }
                }}
                className="relative w-full h-36 bg-slate-100 overflow-hidden cursor-pointer"
              >
                {displayThumbnail ? (
                  // Use native img for fast local Blob / ObjectURL decoding
                  <img
                    src={displayThumbnail}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : isVideo ? (
                  <video
                    src={item.previewUrl}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full text-slate-400">
                    <FileQuestion className="w-8 h-8 mb-1" />
                    <span className="text-xs">Không có xem trước</span>
                  </div>
                )}

                {/* Video Play Overlay Indicator */}
                {isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/25 pointer-events-none">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 border border-emerald-300 text-emerald-700 backdrop-blur-sm shadow-md">
                      <Film className="w-5 h-5 fill-emerald-600/20" />
                    </div>
                  </div>
                )}

                {/* Hover Quick Zoom Pill */}
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-[2px]">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 border border-slate-300 text-slate-800 text-xs font-semibold shadow-md">
                    <Eye className="w-3.5 h-3.5 text-rose-600" />
                    Xem chi tiết
                  </span>
                </div>

                {/* Top Badge: File Type & Size */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
                  <span
                    className={cn(
                      "px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-md shadow-2xs border font-mono",
                      isVideo
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    )}
                  >
                    {isVideo ? "VIDEO" : "IMG"}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-mono text-slate-700 bg-white/90 border border-slate-200 rounded-md backdrop-blur-sm shadow-2xs">
                    {formatBytes(item.size)}
                  </span>
                </div>

                {/* Top Right: Delete Button with Touch Target >= 44px */}
                <div className="absolute top-1.5 right-1.5 z-10">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(item.id);
                    }}
                    aria-label={`Xóa tệp ${item.name}`}
                    className={cn(
                      "flex items-center justify-center w-11 h-11 rounded-full",
                      "text-slate-500 hover:text-rose-600 bg-white/90 hover:bg-rose-50",
                      "border border-slate-200 hover:border-rose-300 backdrop-blur-sm shadow-xs",
                      "transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-rose-400/50 cursor-pointer"
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Bottom Metadata & Upload Progress */}
              <div className="p-3 bg-white border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <p
                    className="font-medium text-slate-800 truncate pr-2"
                    title={item.name}
                  >
                    {item.name}
                  </p>

                  <div className="shrink-0 flex items-center gap-1">
                    {item.status === "uploading" && (
                      <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-rose-600">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {item.progress}%
                      </span>
                    )}
                    {item.status === "success" && (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Sẵn sàng
                      </span>
                    )}
                    {item.status === "error" && (
                      <span
                        className="flex items-center gap-1 text-[11px] text-rose-600 font-bold"
                        title={item.error}
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        Lỗi
                      </span>
                    )}
                    {item.status === "idle" && (
                      <span className="text-[11px] text-slate-400 font-medium">Chờ gửi</span>
                    )}
                  </div>
                </div>

                {/* Progress Bar (Visible during upload or upon error) */}
                {item.status === "uploading" && (
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 transition-all duration-200 ease-out"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}

                {item.status === "error" && item.error && (
                  <p className="text-[11px] text-rose-600 truncate font-medium" title={item.error}>
                    {item.error}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox / Zoom Modal */}
      {activePreview && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setActivePreview(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center bg-white border border-slate-200 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="w-full flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/80">
              <div className="flex items-center gap-2 truncate pr-4">
                {activePreview.type === "video" ? (
                  <Film className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span className="text-sm font-bold text-slate-900 truncate">
                  {activePreview.name}
                </span>
                <span className="text-xs font-mono text-slate-500 shrink-0">
                  ({formatBytes(activePreview.size)})
                </span>
              </div>

              {/* Close Button with Touch Target >= 44px */}
              <button
                type="button"
                onClick={() => setActivePreview(null)}
                aria-label="Đóng xem trước"
                className="flex items-center justify-center w-11 h-11 rounded-xl text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Media Body */}
            <div className="relative w-full flex items-center justify-center p-4 min-h-[300px] max-h-[75vh] overflow-auto bg-slate-950">
              {activePreview.type === "video" ? (
                <video
                  src={activePreview.previewUrl}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[70vh] w-auto max-w-full rounded-lg shadow-lg"
                />
              ) : (
                <img
                  src={activePreview.previewUrl}
                  alt={activePreview.name}
                  className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

