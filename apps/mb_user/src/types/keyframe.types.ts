/**
 * TrustPassz Mobile - Keyframe Types & Constants
 * Clean Architecture type definitions for Keyframe Evidence extraction.
 */

export interface KeyframeResult {
  id: string;
  file: File;
  blob: Blob;
  previewUrl: string;
  timestamp: number;
  percentage: number;
  sizeBytes: number;
  sizeFormatted: string;
  width: number;
  height: number;
  mimeType: string;
}

export type AspectRatioMode = 'letterbox' | 'center-crop';

export interface KeyframeExtractionOptions {
  milestones?: readonly number[];
  maxDimension?: number;
  targetMimeType?: 'image/webp' | 'image/jpeg';
  initialQuality?: number;
  maxSizeBytes?: number;
  aspectMode?: AspectRatioMode;
  seekTimeoutMs?: number;
  onProgress?: (progress: number, currentFrameIndex: number, totalFrames: number) => void;
}

export class KeyframeExtractionError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(`[KeyframeExtractor] ${message}`);
    this.name = 'KeyframeExtractionError';
  }
}

export class UnsupportedMediaError extends KeyframeExtractionError {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedMediaError';
  }
}

export class VideoSeekTimeoutError extends KeyframeExtractionError {
  constructor(timestamp: number) {
    super(`Quá thời gian chờ seek video tại mốc ${timestamp.toFixed(2)}s`);
    this.name = 'VideoSeekTimeoutError';
  }
}

export const STANDARD_MILESTONES = [0.2, 0.5, 0.8] as const;
export const MAX_DIMENSION = 512;
export const DEFAULT_MIME_TYPE = 'image/webp';
export const DEFAULT_QUALITY = 0.82;
export const MAX_FILE_SIZE_BYTES = 200 * 1024; // 200 KB
export const DEFAULT_SEEK_TIMEOUT_MS = 7000;

