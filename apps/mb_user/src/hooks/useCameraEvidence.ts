/**
 * TrustPassz Mobile - useCameraEvidence Hook
 * Manages video evidence capturing, non-blocking keyframe extraction progress,
 * and zero-memory-leak garbage collection triggers.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  extractKeyframesFromVideo,
  revokeKeyframes,
  KeyframeResult,
  KeyframeExtractionOptions,
} from '../services/keyframe-extractor';

export interface UseCameraEvidenceState {
  keyframes: KeyframeResult[];
  isExtracting: boolean;
  progress: number;
  error: string | null;
  videoSource: File | Blob | null;
  selectedKeyframeIndex: number | null;
}

export interface UseCameraEvidenceReturn extends UseCameraEvidenceState {
  processVideoFile: (
    file: File | Blob,
    options?: Partial<KeyframeExtractionOptions>,
  ) => Promise<KeyframeResult[]>;
  resetEvidence: () => void;
  prepareFormData: (dealId: string, reason: string, initiatorId?: string) => FormData;
  setSelectedKeyframeIndex: (index: number | null) => void;
  hasEnoughKeyframes: boolean;
  totalSizeFormatted: string;
}

export function useCameraEvidence(): UseCameraEvidenceReturn {
  const [keyframes, setKeyframes] = useState<KeyframeResult[]>([]);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [videoSource, setVideoSource] = useState<File | Blob | null>(null);
  const [selectedKeyframeIndex, setSelectedKeyframeIndex] = useState<number | null>(null);

  // Ref to track active keyframes for complete cleanup on unmount
  const keyframesRef = useRef<KeyframeResult[]>([]);
  keyframesRef.current = keyframes;

  const resetEvidence = useCallback(() => {
    if (keyframesRef.current.length > 0) {
      revokeKeyframes(keyframesRef.current);
    }
    setKeyframes([]);
    setVideoSource(null);
    setProgress(0);
    setError(null);
    setIsExtracting(false);
    setSelectedKeyframeIndex(null);
  }, []);

  // Cleanup on unmount (Zero Memory Leak)
  useEffect(() => {
    return () => {
      if (keyframesRef.current.length > 0) {
        revokeKeyframes(keyframesRef.current);
      }
    };
  }, []);

  const processVideoFile = useCallback(
    async (
      file: File | Blob,
      options?: Partial<KeyframeExtractionOptions>,
    ): Promise<KeyframeResult[]> => {
      // Clear any prior keyframes and revoke prior URLs
      if (keyframesRef.current.length > 0) {
        revokeKeyframes(keyframesRef.current);
      }
      setKeyframes([]);
      setVideoSource(file);
      setIsExtracting(true);
      setProgress(0);
      setError(null);

      try {
        const extracted = await extractKeyframesFromVideo(file, {
          ...options,
          onProgress: (pct) => {
            setProgress(pct);
          },
        });

        setKeyframes(extracted);
        setProgress(100);
        setIsExtracting(false);
        return extracted;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Đã xảy ra lỗi không xác định khi trích xuất khung hình';
        setError(message);
        setIsExtracting(false);
        setProgress(0);
        throw err;
      }
    },
    [],
  );

  const prepareFormData = useCallback(
    (dealId: string, reason: string, initiatorId?: string): FormData => {
      const formData = new FormData();
      formData.append('dealId', dealId.trim());
      formData.append('reason', reason.trim());

      if (initiatorId && initiatorId.trim().length > 0) {
        formData.append('initiatorId', initiatorId.trim());
      }

      // Attach extracted keyframes (files)
      keyframes.forEach((kf, index) => {
        formData.append('files', kf.file, kf.file.name || `evidence_keyframe_${index + 1}.webp`);
      });

      return formData;
    },
    [keyframes],
  );

  // Compute total size across all keyframes
  const totalSizeBytes = keyframes.reduce((sum, kf) => sum + kf.sizeBytes, 0);
  const totalSizeFormatted =
    totalSizeBytes > 0 ? `${(totalSizeBytes / 1024).toFixed(1)} KB` : '0 KB';

  return {
    keyframes,
    isExtracting,
    progress,
    error,
    videoSource,
    selectedKeyframeIndex,
    processVideoFile,
    resetEvidence,
    prepareFormData,
    setSelectedKeyframeIndex,
    hasEnoughKeyframes: keyframes.length === 3,
    totalSizeFormatted,
  };
}

