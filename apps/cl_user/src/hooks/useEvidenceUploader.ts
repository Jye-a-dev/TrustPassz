"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { generateVideoThumbnail } from "@/lib/video-thumbnail";
import {
  EVIDENCE_LIMITS,
  EvidenceFileItem,
  SignedUrlResponse,
  validateEvidenceFile,
} from "@/types/evidence-upload";

export interface UseEvidenceUploaderOptions {
  dealId?: string;
  maxFiles?: number;
  onUploadSuccess?: (urls: string[]) => void;
  onUploadError?: (error: string) => void;
}

export function useEvidenceUploader(options: UseEvidenceUploaderOptions = {}) {
  const { dealId: defaultDealId, maxFiles = EVIDENCE_LIMITS.MAX_FILES } = options;

  const [files, setFiles] = useState<EvidenceFileItem[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Active XHR requests tracked by file id for cancellation
  const activeXhrsRef = useRef<Map<string, XMLHttpRequest>>(new Map());

  // Mutable reference for guaranteed unmount memory cleanup
  const filesRef = useRef<EvidenceFileItem[]>([]);
  filesRef.current = files;

  /**
   * Cleans up Object URLs created for client-side previews to eliminate memory leaks.
   */
  const revokeFilePreview = (item: EvidenceFileItem) => {
    if (item.previewUrl && item.previewUrl.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(item.previewUrl);
      } catch {
        // Safe disposal
      }
    }
  };

  /**
   * Adds incoming files into upload queue after strict security & quota checks.
   */
  const addFiles = useCallback(
    async (incoming: FileList | File[]) => {
      const incomingList = Array.from(incoming);
      if (incomingList.length === 0) return;

      const currentCount = filesRef.current.length;
      if (currentCount >= maxFiles) {
        toast.error(`Đã đạt giới hạn tối đa ${maxFiles} tệp bằng chứng cho một ca khiếu nại.`);
        return;
      }

      const availableSlots = maxFiles - currentCount;
      const processList = incomingList.slice(0, availableSlots);

      if (incomingList.length > availableSlots) {
        toast.warning(
          `Chỉ tiếp nhận thêm ${availableSlots} tệp. Các tệp vượt quá giới hạn đã được bỏ qua.`
        );
      }

      const processedItems: EvidenceFileItem[] = [];

      for (const file of processList) {
        const validation = await validateEvidenceFile(file);
        if (!validation.valid) {
          toast.error(validation.error || `Tệp "${file.name}" không hợp lệ.`);
          continue;
        }

        const mediaType = validation.type || (file.type.startsWith("video") ? "video" : "image");
        const previewUrl = URL.createObjectURL(file);
        const fileId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

        let thumbnailUrl: string | undefined;
        let duration: number | undefined;

        if (mediaType === "video") {
          try {
            const thumbnailResult = await generateVideoThumbnail(file, 1.0);
            thumbnailUrl = thumbnailResult.thumbnailUrl;
            duration = thumbnailResult.duration;
          } catch {
            // Fallback gracefully without breaking upload pipeline
            thumbnailUrl = undefined;
          }
        }

        processedItems.push({
          id: fileId,
          file,
          name: file.name,
          size: file.size,
          mimeType: file.type || (mediaType === "video" ? "video/mp4" : "image/jpeg"),
          type: mediaType,
          previewUrl,
          thumbnailUrl,
          duration,
          progress: 0,
          status: "idle",
        });
      }

      if (processedItems.length > 0) {
        setFiles((prev) => [...prev, ...processedItems]);
      }
    },
    [maxFiles]
  );

  /**
   * Removes a specific file from the queue and releases its Blob URL.
   */
  const removeFile = useCallback((fileId: string) => {
    // Abort active upload if currently running
    const activeXhr = activeXhrsRef.current.get(fileId);
    if (activeXhr) {
      activeXhr.abort();
      activeXhrsRef.current.delete(fileId);
    }

    setFiles((prev) => {
      const target = prev.find((f) => f.id === fileId);
      if (target) {
        revokeFilePreview(target);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  }, []);

  /**
   * Resets all files in state and cancels all in-flight uploads.
   */
  const clearAll = useCallback(() => {
    activeXhrsRef.current.forEach((xhr) => xhr.abort());
    activeXhrsRef.current.clear();

    filesRef.current.forEach(revokeFilePreview);
    setFiles([]);
  }, []);

  /**
   * Executes Direct-to-S3 upload for a single file item via Signed URL.
   */
  const uploadSingleFile = useCallback(
    (item: EvidenceFileItem, targetDealId: string): Promise<string> => {
      return new Promise<string>((resolve, reject) => {
        // Step 1: Request signed upload url from backend
        apiClient<SignedUrlResponse>("/api/v1/disputes/signed-upload-urls", {
          method: "POST",
          body: JSON.stringify({
            dealId: targetDealId,
            fileName: item.name,
            mimeType: item.mimeType,
            fileSize: item.size,
          }),
        })
          .then((signedData) => {
            const { signedUrl, storagePath, publicUrl } = signedData;

            // Step 2: Direct PUT upload to Supabase Storage via XMLHttpRequest
            const xhr = new XMLHttpRequest();
            activeXhrsRef.current.set(item.id, xhr);

            xhr.open("PUT", signedUrl, true);
            xhr.setRequestHeader("Content-Type", item.mimeType);

            xhr.upload.onprogress = (evt) => {
              if (evt.lengthComputable) {
                const percent = Math.min(99, Math.round((evt.loaded / evt.total) * 100));
                setFiles((prev) =>
                  prev.map((f) =>
                    f.id === item.id ? { ...f, progress: percent, status: "uploading" } : f
                  )
                );
              }
            };

            xhr.onload = () => {
              activeXhrsRef.current.delete(item.id);
              if (xhr.status >= 200 && xhr.status < 300) {
                setFiles((prev) =>
                  prev.map((f) =>
                    f.id === item.id
                      ? {
                          ...f,
                          progress: 100,
                          status: "success",
                          storagePath,
                          publicUrl,
                        }
                      : f
                  )
                );
                resolve(publicUrl || storagePath);
              } else {
                const err = `Tải lên thất bại (HTTP ${xhr.status})`;
                setFiles((prev) =>
                  prev.map((f) =>
                    f.id === item.id ? { ...f, status: "error", error: err } : f
                  )
                );
                reject(new Error(err));
              }
            };

            xhr.onerror = () => {
              activeXhrsRef.current.delete(item.id);
              const err = "Mất kết nối mạng khi tải lên Storage";
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === item.id ? { ...f, status: "error", error: err } : f
                )
              );
              reject(new Error(err));
            };

            xhr.onabort = () => {
              activeXhrsRef.current.delete(item.id);
              reject(new Error("Hủy tải lên"));
            };

            xhr.send(item.file);
          })
          .catch((err) => {
            const msg =
              err instanceof Error ? err.message : "Không thể tạo Signed Upload URL";
            setFiles((prev) =>
              prev.map((f) =>
                f.id === item.id ? { ...f, status: "error", error: msg } : f
              )
            );
            reject(new Error(msg));
          });
      });
    },
    []
  );

  /**
   * Uploads all pending files and returns list of persistent public URLs.
   */
  const uploadAll = useCallback(
    async (dealIdOverride?: string): Promise<string[]> => {
      const activeDealId = dealIdOverride || defaultDealId;
      if (!activeDealId) {
        throw new Error("dealId là bắt buộc để bắt đầu tải lên bằng chứng.");
      }

      const pendingItems = filesRef.current.filter((f) => f.status !== "success");
      if (pendingItems.length === 0) {
        return filesRef.current
          .map((f) => f.publicUrl || f.storagePath || "")
          .filter(Boolean);
      }

      setIsUploading(true);

      try {
        const uploadPromises = pendingItems.map((item) =>
          uploadSingleFile(item, activeDealId)
        );
        const newUploadedUrls = await Promise.all(uploadPromises);

        const allUrls = filesRef.current
          .map((f) => f.publicUrl || f.storagePath || "")
          .filter(Boolean);

        const combinedUrls = Array.from(new Set([...allUrls, ...newUploadedUrls]));
        options.onUploadSuccess?.(combinedUrls);
        return combinedUrls;
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Lỗi khi tải lên bằng chứng";
        options.onUploadError?.(errMsg);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    [defaultDealId, options, uploadSingleFile]
  );

  // Zero memory leak cleanup on unmount
  useEffect(() => {
    return () => {
      activeXhrsRef.current.forEach((xhr) => xhr.abort());
      activeXhrsRef.current.clear();
      filesRef.current.forEach(revokeFilePreview);
    };
  }, []);

  return {
    files,
    isUploading,
    isDragOver,
    setIsDragOver,
    addFiles,
    removeFile,
    clearAll,
    uploadAll,
    canAddMore: files.length < maxFiles,
    totalFilesCount: files.length,
    successfulUrls: files
      .filter((f) => f.status === "success" && (f.publicUrl || f.storagePath))
      .map((f) => f.publicUrl || f.storagePath || ""),
  };
}

