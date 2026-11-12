"use client";

import * as React from "react";
import { Upload, X, Star, ImageIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DealImageGalleryUploaderProps {
  mediaGallery: string[];
  coverIndex: number;
  onChange: (images: string[], coverIndex: number) => void;
  maxImages?: number;
  maxSizeBytes?: number;
  disabled?: boolean;
}

export function DealImageGalleryUploader({
  mediaGallery,
  coverIndex,
  onChange,
  maxImages = 8,
  maxSizeBytes = 5 * 1024 * 1024, // 5MB
  disabled = false,
}: DealImageGalleryUploaderProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const processFiles = (files: FileList | File[]) => {
    const validFiles: File[] = [];
    const currentCount = mediaGallery.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        toast.error(`Tệp "${file.name}" không hợp lệ. Chỉ chấp nhận JPG, PNG, WEBP.`);
        continue;
      }
      if (file.size > maxSizeBytes) {
        toast.error(`Tệp "${file.name}" vượt quá 5MB (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
        continue;
      }
      validFiles.push(file);
    }

    if (currentCount + validFiles.length > maxImages) {
      toast.error(`Bạn chỉ có thể tải lên tối đa ${maxImages} hình ảnh sản phẩm.`);
      validFiles.splice(maxImages - currentCount);
    }

    if (validFiles.length === 0) return;

    // Convert valid files to Data URLs
    const readPromises = validFiles.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
          }
        };
        reader.readAsDataURL(file);
      });
    });

    void Promise.all(readPromises).then((newUrls) => {
      const updated = [...mediaGallery, ...newUrls];
      onChange(updated, coverIndex);
      toast.success(`Đã thêm ${newUrls.length} ảnh vào danh sách xem trước!`);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // Reset file input value to allow re-selecting the same file if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = (index: number) => {
    const updated = mediaGallery.filter((_, i) => i !== index);
    let newCover = coverIndex;
    if (coverIndex === index) {
      newCover = 0;
    } else if (coverIndex > index) {
      newCover = coverIndex - 1;
    }
    onChange(updated, newCover);
    toast.info("Đã xóa ảnh khỏi danh sách.");
  };

  const handleSetCover = (index: number) => {
    onChange(mediaGallery, index);
    toast.success("Đã chọn ảnh này làm ảnh bìa chính!");
  };

  return (
    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
            <ImageIcon className="size-4 text-rose-500" />
            <span>HÌNH ẢNH SẢN PHẨM &amp; NGOẠI QUAN ({mediaGallery.length}/{maxImages})</span>
          </label>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Tối đa {maxImages} ảnh, tối đa 5MB/ảnh (JPG, PNG, WEBP). Ảnh đầu tiên sẽ làm ảnh bìa niêm yết.
          </p>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      {mediaGallery.length < maxImages && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={cn(
            "relative flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer select-none",
            isDragging
              ? "border-rose-500 bg-rose-50/50 dark:bg-rose-950/40"
              : "border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950/60 hover:border-rose-400 hover:bg-rose-50/30",
            disabled && "opacity-50 cursor-not-allowed pointer-events-none"
          )}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={disabled}
          />
          <div className="flex size-12 items-center justify-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-rose-500 shadow-sm mb-2.5">
            <Upload className="size-5" />
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 text-center">
            Kéo thả nhiều ảnh vào đây hoặc bấm để chọn tệp
          </span>
          <span className="text-[11px] text-slate-400 font-mono mt-1">
            Hỗ trợ chọn nhiều file cùng lúc (Tối đa 5MB/ảnh)
          </span>
        </div>
      )}

      {/* Gallery Preview Grid */}
      {mediaGallery.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {mediaGallery.map((imgSrc, idx) => {
            const isCover = idx === coverIndex;
            return (
              <div
                key={idx}
                className={cn(
                  "relative group rounded-2xl border overflow-hidden aspect-square bg-slate-100 dark:bg-slate-800 transition-all",
                  isCover
                    ? "border-2 border-rose-500 ring-2 ring-rose-500/20 shadow-md"
                    : "border-slate-200 dark:border-slate-700"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imgSrc}
                  alt={`Preview ${idx + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Cover Badge */}
                {isCover ? (
                  <Badge className="absolute top-2 left-2 bg-rose-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-1">
                    <Star className="size-3 fill-white" />
                    <span>Ảnh Bìa</span>
                  </Badge>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetCover(idx)}
                    disabled={disabled}
                    className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 hover:bg-black/90 text-white text-[10px] font-semibold px-2 py-1 rounded-lg backdrop-blur-xs cursor-pointer min-h-[30px]"
                  >
                    Đặt ảnh bìa
                  </button>
                )}

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDelete(idx)}
                  disabled={disabled}
                  aria-label="Xóa ảnh này"
                  className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-lg bg-black/70 hover:bg-rose-600 text-white transition-colors cursor-pointer min-h-[32px] min-w-[32px]"
                >
                  <X className="size-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
