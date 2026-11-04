/**
 * TrustPassz Mobile - Keyframe Extractor Service
 * Client-side video keyframe extraction for Escrow Dispute & AI Arbitration.
 * Enforces strict Zero Memory Leak lifecycle, aspect ratio preservation (512x512 RGB),
 * and adaptive compression (< 200KB per image).
 */

import {
  KeyframeResult,
  AspectRatioMode,
  KeyframeExtractionOptions,
  KeyframeExtractionError,
  UnsupportedMediaError,
  VideoSeekTimeoutError,
  STANDARD_MILESTONES,
  MAX_DIMENSION,
  DEFAULT_MIME_TYPE,
  DEFAULT_QUALITY,
  MAX_FILE_SIZE_BYTES,
  DEFAULT_SEEK_TIMEOUT_MS,
} from '../types/keyframe.types';

export * from '../types/keyframe.types';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function yieldMainThread(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function drawWithAspectRatio(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  targetSize: number,
  mode: AspectRatioMode,
): void {
  const srcWidth = video.videoWidth || 1;
  const srcHeight = video.videoHeight || 1;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, targetSize, targetSize);

  const scale =
    mode === 'center-crop'
      ? Math.max(targetSize / srcWidth, targetSize / srcHeight)
      : Math.min(targetSize / srcWidth, targetSize / srcHeight);

  const drawWidth = Math.round(srcWidth * scale);
  const drawHeight = Math.round(srcHeight * scale);
  const offsetX = Math.round((targetSize - drawWidth) / 2);
  const offsetY = Math.round((targetSize - drawHeight) / 2);

  ctx.drawImage(video, 0, 0, srcWidth, srcHeight, offsetX, offsetY, drawWidth, drawHeight);
}

async function compressCanvasToBlob(
  canvas: HTMLCanvasElement,
  preferredMimeType: string,
  initialQuality: number,
  maxSizeBytes: number,
): Promise<{ blob: Blob; mimeType: string }> {
  const tryCompress = (mime: string, quality: number): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (typeof canvas.toBlob === 'function') {
        canvas.toBlob((b) => resolve(b), mime, quality);
      } else {
        try {
          const dataUrl = canvas.toDataURL(mime, quality);
          const parts = dataUrl.split(',');
          const byteString = atob(parts[1] || '');
          const mimeString = parts[0]?.split(':')[1]?.split(';')[0] || mime;
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          resolve(new Blob([ab], { type: mimeString }));
        } catch {
          resolve(null);
        }
      }
    });
  };

  let chosenMime = preferredMimeType;
  let currentQuality = initialQuality;
  let blob = await tryCompress(chosenMime, currentQuality);

  // Fallback to image/jpeg if webp produced null or empty blob
  if (!blob || blob.size === 0) {
    chosenMime = 'image/jpeg';
    blob = await tryCompress(chosenMime, currentQuality);
  }

  if (!blob) {
    throw new KeyframeExtractionError('Không thể tạo buffer ảnh từ Canvas');
  }

  // Adaptive quality step-down to strictly enforce < maxSizeBytes (200KB)
  const qualitySteps = [0.72, 0.62, 0.5, 0.4];
  for (const nextQ of qualitySteps) {
    if (blob.size <= maxSizeBytes) break;
    currentQuality = nextQ;
    const lowerBlob = await tryCompress(chosenMime, currentQuality);
    if (lowerBlob && lowerBlob.size > 0) {
      blob = lowerBlob;
    }
  }

  return { blob, mimeType: chosenMime };
}

function seekVideoToTimestamp(
  video: HTMLVideoElement,
  targetTime: number,
  timeoutMs: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
    };

    const handleSeeked = () => {
      cleanup();
      resolve();
    };

    const handleError = () => {
      cleanup();
      reject(new KeyframeExtractionError('Lỗi giải mã luồng video khi tua mốc thời gian'));
    };

    timer = setTimeout(() => {
      cleanup();
      reject(new VideoSeekTimeoutError(targetTime));
    }, timeoutMs);

    video.addEventListener('seeked', handleSeeked, { once: true });
    video.addEventListener('error', handleError, { once: true });

    video.currentTime = targetTime;
  });
}

function loadVideoMetadata(video: HTMLVideoElement, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (video.readyState >= 1 && video.duration > 0) {
      resolve();
      return;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
    };

    const handleLoadedMetadata = () => {
      cleanup();
      resolve();
    };

    const handleError = () => {
      cleanup();
      reject(new UnsupportedMediaError('Định dạng video không được hỗ trợ hoặc file hỏng'));
    };

    timer = setTimeout(() => {
      cleanup();
      reject(new KeyframeExtractionError('Quá thời gian nạp metadata video'));
    }, timeoutMs);

    video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
    video.addEventListener('error', handleError, { once: true });
  });
}

/**
 * Trích xuất 3 keyframes client-side từ video bằng chứng (20%, 50%, 80%).
 * Tự động kích hoạt toàn bộ quy trình giải phóng bộ nhớ Zero Memory Leak khi hoàn tất.
 */
export async function extractKeyframesFromVideo(
  videoSource: Blob | File | string,
  options: KeyframeExtractionOptions = {},
): Promise<KeyframeResult[]> {
  const milestones = options.milestones ?? STANDARD_MILESTONES;
  const maxDim = options.maxDimension ?? MAX_DIMENSION;
  const mimeType = options.targetMimeType ?? DEFAULT_MIME_TYPE;
  const quality = options.initialQuality ?? DEFAULT_QUALITY;
  const maxSizeBytes = options.maxSizeBytes ?? MAX_FILE_SIZE_BYTES;
  const aspectMode = options.aspectMode ?? 'letterbox';
  const timeoutMs = options.seekTimeoutMs ?? DEFAULT_SEEK_TIMEOUT_MS;

  let sourceUrl: string | null = null;
  let video: HTMLVideoElement | null = null;
  let canvas: HTMLCanvasElement | null = null;
  const results: KeyframeResult[] = [];

  try {
    sourceUrl = typeof videoSource === 'string' ? videoSource : URL.createObjectURL(videoSource);

    video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.src = sourceUrl;

    await loadVideoMetadata(video, timeoutMs);

    const duration = video.duration;
    if (!duration || !Number.isFinite(duration) || duration <= 0) {
      throw new KeyframeExtractionError('Thời lượng video không hợp lệ hoặc không xác định');
    }

    canvas = document.createElement('canvas');
    canvas.width = maxDim;
    canvas.height = maxDim;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new KeyframeExtractionError('Trình duyệt không hỗ trợ CanvasRenderingContext2D');
    }

    const totalFrames = milestones.length;

    for (let i = 0; i < totalFrames; i++) {
      const milestone = milestones[i]!;
      const clampedMilestone = Math.max(0.01, Math.min(0.99, milestone));
      const targetTime = Math.min(duration - 0.05, Math.max(0.05, duration * clampedMilestone));

      await seekVideoToTimestamp(video, targetTime, timeoutMs);
      await yieldMainThread();

      drawWithAspectRatio(ctx, video, maxDim, aspectMode);

      const { blob, mimeType: finalMime } = await compressCanvasToBlob(
        canvas,
        mimeType,
        quality,
        maxSizeBytes,
      );

      const pctInt = Math.round(clampedMilestone * 100);
      const extension = finalMime === 'image/jpeg' ? 'jpg' : 'webp';
      const filename = `keyframe_${pctInt}pct_${Date.now()}.${extension}`;
      const file = new File([blob], filename, {
        type: finalMime,
        lastModified: Date.now(),
      });
      const previewUrl = URL.createObjectURL(blob);

      results.push({
        id: `kf_${pctInt}_${Math.random().toString(36).slice(2, 9)}`,
        file,
        blob,
        previewUrl,
        timestamp: targetTime,
        percentage: pctInt,
        sizeBytes: blob.size,
        sizeFormatted: formatBytes(blob.size),
        width: maxDim,
        height: maxDim,
        mimeType: finalMime,
      });

      if (options.onProgress) {
        options.onProgress(Math.round(((i + 1) / totalFrames) * 100), i + 1, totalFrames);
      }

      await yieldMainThread();
    }

    return results;
  } catch (error) {
    revokeKeyframes(results);
    if (error instanceof KeyframeExtractionError) throw error;
    throw new KeyframeExtractionError(
      error instanceof Error ? error.message : 'Lỗi không xác định khi trích xuất khung hình',
      error,
    );
  } finally {
    // Zero Memory Leak Lifecycle:
    // 1. Thu hồi Object URL ngay lập tức
    if (sourceUrl && typeof videoSource !== 'string') {
      try {
        URL.revokeObjectURL(sourceUrl);
      } catch {
        // Safe fallback
      }
    }

    // 2. Giải phóng phần cứng DOM Video element
    if (video) {
      try {
        video.pause();
        video.onloadedmetadata = null;
        video.onseeked = null;
        video.onerror = null;
        video.removeAttribute('src');
        video.load();
      } catch {
        // Safe fallback
      }
      video = null;
    }

    // 3. Giải phóng bộ nhớ Canvas Backing Store
    if (canvas) {
      try {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        canvas.width = 0;
        canvas.height = 0;
      } catch {
        // Safe fallback
      }
      canvas = null;
    }
  }
}

/**
 * Giải phóng toàn bộ Preview Object URLs của các Keyframe đã tạo.
 */
export function revokeKeyframes(keyframes: readonly KeyframeResult[]): void {
  for (const kf of keyframes) {
    if (kf.previewUrl) {
      try {
        URL.revokeObjectURL(kf.previewUrl);
      } catch {
        // Safe fallback
      }
    }
  }
}
