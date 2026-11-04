"use client";

import * as React from "react";
import { UploadCloud, FileImage, Film, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { EVIDENCE_LIMITS } from "@/types/evidence-upload";

export interface EvidenceDropzoneProps {
  onFilesSelected: (files: FileList | File[]) => void;
  isUploading?: boolean;
  currentCount?: number;
  maxFiles?: number;
  className?: string;
  disabled?: boolean;
}

export function EvidenceDropzone({
  onFilesSelected,
  isUploading = false,
  currentCount = 0,
  maxFiles = EVIDENCE_LIMITS.MAX_FILES,
  className = "",
  disabled = false,
}: EvidenceDropzoneProps) {
  const [isDragOver, setIsDragOver] = React.useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const isFull = currentCount >= maxFiles;
  const isInteractionDisabled = disabled || isUploading || isFull;

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInteractionDisabled) return;
    setIsDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInteractionDisabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Prevent flickering when hovering over children
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (isInteractionDisabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
      // Reset input value so identical file selection works
      e.target.value = "";
    }
  };

  const triggerBrowse = () => {
    if (isInteractionDisabled) return;
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isInteractionDisabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      triggerBrowse();
    }
  };

  return (
    <div
      role="button"
      tabIndex={isInteractionDisabled ? -1 : 0}
      aria-label="Kéo thả tệp bằng chứng hoặc nhấn để chọn tệp"
      aria-disabled={isInteractionDisabled}
      onClick={triggerBrowse}
      onKeyDown={handleKeyDown}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative group flex flex-col items-center justify-center text-center",
        "w-full min-h-[190px] p-6 rounded-xl cursor-pointer select-none",
        "bg-[#0B0F17]/80 backdrop-blur-md transition-all duration-300 ease-out",
        "border-2 border-dashed",
        isDragOver
          ? "border-cyan-400 bg-cyan-950/20 shadow-[0_0_28px_rgba(6,182,212,0.3)] scale-[1.008]"
          : "border-zinc-800 hover:border-zinc-700 hover:bg-slate-900/50",
        isInteractionDisabled && "cursor-not-allowed opacity-60 hover:border-zinc-800 hover:bg-[#0B0F17]/80",
        className
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".png,.jpg,.jpeg,.webp,.mp4,.mov,.webm"
        className="hidden"
        disabled={isInteractionDisabled}
        onChange={handleInputChange}
      />

      {/* Cyber Highlight Corner Accents */}
      <div
        className={cn(
          "absolute top-2 left-2 w-2.5 h-2.5 border-t-2 border-l-2 transition-colors duration-300",
          isDragOver ? "border-cyan-400" : "border-zinc-700 group-hover:border-zinc-500"
        )}
      />
      <div
        className={cn(
          "absolute top-2 right-2 w-2.5 h-2.5 border-t-2 border-r-2 transition-colors duration-300",
          isDragOver ? "border-cyan-400" : "border-zinc-700 group-hover:border-zinc-500"
        )}
      />
      <div
        className={cn(
          "absolute bottom-2 left-2 w-2.5 h-2.5 border-b-2 border-l-2 transition-colors duration-300",
          isDragOver ? "border-emerald-400" : "border-zinc-700 group-hover:border-zinc-500"
        )}
      />
      <div
        className={cn(
          "absolute bottom-2 right-2 w-2.5 h-2.5 border-b-2 border-r-2 transition-colors duration-300",
          isDragOver ? "border-emerald-400" : "border-zinc-700 group-hover:border-zinc-500"
        )}
      />

      {/* Primary Icon Container */}
      <div
        className={cn(
          "flex items-center justify-center w-14 h-14 rounded-full mb-3.5 transition-all duration-300",
          isDragOver
            ? "bg-cyan-500/20 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
            : "bg-slate-900 border border-zinc-800 text-zinc-400 group-hover:text-cyan-400 group-hover:border-zinc-700"
        )}
      >
        <UploadCloud className="w-7 h-7 transition-transform duration-300 group-hover:-translate-y-0.5" />
      </div>

      {/* Informative Guidance */}
      <div className="space-y-1.5 max-w-md">
        <p className="text-sm font-medium text-zinc-200">
          {isFull ? (
            <span className="text-amber-400">Đã đạt tối đa {maxFiles} tệp bằng chứng</span>
          ) : isDragOver ? (
            <span className="text-cyan-400 font-semibold animate-pulse">
              Thả tệp vào đây để tiếp nhận bằng chứng
            </span>
          ) : (
            <>
              Kéo thả bằng chứng vào đây hoặc{" "}
              <span className="text-cyan-400 underline underline-offset-4 font-semibold hover:text-cyan-300">
                chọn từ thiết bị
              </span>
            </>
          )}
        </p>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Ảnh (PNG, JPG, WebP) tối đa <strong className="text-zinc-300">15MB</strong> • Video (MP4, MOV) tối đa{" "}
          <strong className="text-zinc-300">50MB</strong>
        </p>
      </div>

      {/* File Quota & Badges */}
      <div className="flex items-center gap-2 mt-4 text-[11px] text-zinc-400">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-zinc-800">
          <FileImage className="w-3.5 h-3.5 text-cyan-400" />
          <span>Ảnh</span>
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-zinc-800">
          <Film className="w-3.5 h-3.5 text-emerald-400" />
          <span>Video</span>
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full border",
            isFull
              ? "bg-amber-950/40 text-amber-300 border-amber-800/60"
              : "bg-slate-900 text-zinc-400 border-zinc-800"
          )}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            {currentCount}/{maxFiles} tệp
          </span>
        </span>
      </div>
    </div>
  );
}

