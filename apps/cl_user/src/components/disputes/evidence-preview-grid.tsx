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
      <div className="flex items-center justify-between text-xs text-zinc-400 px-0.5">
        <span>Danh sách bằng chứng đã đính kèm ({files.length}/5)</span>
        <span className="text-zinc-400">Bấm vào tệp để xem trước</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {files.map((item) => {
          const isVideo = item.type === "video";
          const displayThumbnail = item.thumbnailUrl || (isVideo ? "" : item.previewUrl);

          return (
            <div
              key={item.id}
              className={cn(
                "group relative flex flex-col justify-between overflow-hidden rounded-xl",
                "bg-[#0F172A] border border-zinc-800 transition-all duration-200",
                "hover:border-zinc-700 hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
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
                className="relative w-full h-36 bg-[#0B0F17] overflow-hidden cursor-pointer"
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
                  <div className="flex flex-col items-center justify-center w-full h-full text-zinc-600">
                    <FileQuestion className="w-8 h-8 mb-1" />
                    <span className="text-xs">Không có xem trước</span>
                  </div>
                )}

                {/* Video Play Overlay Indicator */}
                {isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/35 pointer-events-none">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-900/80 border border-emerald-500/50 text-emerald-400 backdrop-blur-sm shadow-lg">
                      <Film className="w-5 h-5 fill-emerald-400/20" />
                    </div>
                  </div>
                )}

                {/* Hover Quick Zoom Pill */}
                <div className="absolute inset-0 flex items-center justify-center bg-cyan-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-[2px]">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/90 border border-cyan-500/40 text-cyan-300 text-xs font-medium shadow-md">
                    <Eye className="w-3.5 h-3.5" />
                    Xem chi tiết
                  </span>
                </div>

                {/* Top Badge: File Type & Size */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
                  <span
                    className={cn(
                      "px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-md shadow-sm border",
                      isVideo
                        ? "bg-emerald-950/80 text-emerald-300 border-emerald-800/80"
                        : "bg-cyan-950/80 text-cyan-300 border-cyan-800/80"
                    )}
                  >
                    {isVideo ? "VIDEO" : "IMG"}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-mono text-zinc-300 bg-black/60 rounded-md backdrop-blur-sm">
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
                      "text-zinc-400 hover:text-red-400 bg-slate-950/80 hover:bg-red-950/40",
                      "border border-zinc-700/80 hover:border-red-500/50 backdrop-blur-sm",
                      "transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-400/50"
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Bottom Metadata & Upload Progress */}
              <div className="p-3 bg-[#0F172A] border-t border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <p
                    className="font-medium text-zinc-200 truncate pr-2"
                    title={item.name}
                  >
                    {item.name}
                  </p>

                  <div className="shrink-0 flex items-center gap-1">
                    {item.status === "uploading" && (
                      <span className="flex items-center gap-1 text-[11px] font-mono text-cyan-400">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {item.progress}%
                      </span>
                    )}
                    {item.status === "success" && (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Sẵn sàng
                      </span>
                    )}
                    {item.status === "error" && (
                      <span
                        className="flex items-center gap-1 text-[11px] text-red-400 font-medium"
                        title={item.error}
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        Lỗi
                      </span>
                    )}
                    {item.status === "idle" && (
                      <span className="text-[11px] text-zinc-400">Chờ gửi</span>
                    )}
                  </div>
                </div>

                {/* Progress Bar (Visible during upload or upon error) */}
                {item.status === "uploading" && (
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-200 ease-out"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}

                {item.status === "error" && item.error && (
                  <p className="text-[11px] text-red-400/90 truncate" title={item.error}>
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActivePreview(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center bg-[#0B0F17] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="w-full flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-[#0F172A]/90">
              <div className="flex items-center gap-2 truncate pr-4">
                {activePreview.type === "video" ? (
                  <Film className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                )}
                <span className="text-sm font-medium text-zinc-200 truncate">
                  {activePreview.name}
                </span>
                <span className="text-xs font-mono text-zinc-400 shrink-0">
                  ({formatBytes(activePreview.size)})
                </span>
              </div>

              {/* Close Button with Touch Target >= 44px */}
              <button
                type="button"
                onClick={() => setActivePreview(null)}
                aria-label="Đóng xem trước"
                className="flex items-center justify-center w-11 h-11 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Media Body */}
            <div className="relative w-full flex items-center justify-center p-4 min-h-[300px] max-h-[75vh] overflow-auto">
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

