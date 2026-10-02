/**
 * keyframe-extractor.ts
 * Trích xuất chính xác 3 khung hình (20%, 50%, 80%) từ video file/Blob
 * Tự động scale tỉ lệ vừa khung 512x512 và nén JPEG/WebP (<200KB)
 */

export interface ExtractedFrame {
  blob: Blob;
  previewUrl: string;
  timestampSec: number;
}

export async function extractKeyframes(
  videoSource: File | Blob
): Promise<ExtractedFrame[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const sourceUrl = URL.createObjectURL(videoSource);

    video.src = sourceUrl;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    const cleanUp = () => {
      URL.revokeObjectURL(sourceUrl);
      video.remove();
    };

    video.onloadedmetadata = async () => {
      const duration = video.duration;
      if (!duration || isNaN(duration) || duration <= 0) {
        cleanUp();
        reject(new Error('Thời lượng video không hợp lệ hoặc không đọc được metadata.'));
        return;
      }

      const checkpoints = [duration * 0.2, duration * 0.5, duration * 0.8];
      const frames: ExtractedFrame[] = [];

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx) {
        cleanUp();
        reject(new Error('Canvas 2D context không được hỗ trợ trên thiết bị.'));
        return;
      }

      // Tính kích thước vừa chuẩn 512x512 giữ nguyên aspect ratio
      const MAX_DIMENSION = 512;
      let targetWidth = video.videoWidth || 512;
      let targetHeight = video.videoHeight || 512;

      if (targetWidth > targetHeight) {
        if (targetWidth > MAX_DIMENSION) {
          targetHeight = Math.round((targetHeight * MAX_DIMENSION) / targetWidth);
          targetWidth = MAX_DIMENSION;
        }
      } else {
        if (targetHeight > MAX_DIMENSION) {
          targetWidth = Math.round((targetWidth * MAX_DIMENSION) / targetHeight);
          targetHeight = MAX_DIMENSION;
        }
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      try {
        for (const time of checkpoints) {
          await seekToTime(video, time);
          ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

          const frameBlob = await canvasToBlob(canvas, 'image/jpeg', 0.82);
          frames.push({
            blob: frameBlob,
            previewUrl: URL.createObjectURL(frameBlob),
            timestampSec: Math.round(time * 10) / 10,
          });
        }

        cleanUp();
        resolve(frames);
      } catch (extractErr) {
        cleanUp();
        reject(extractErr);
      }
    };

    video.onerror = () => {
      cleanUp();
      reject(new Error('Lỗi load file video để trích xuất keyframes.'));
    };
  });
}

function seekToTime(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((res, rej) => {
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
      res();
    };
    const onError = () => {
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
      rej(new Error(`Không thể tua video đến mốc thời gian ${time}s`));
    };

    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);
    video.currentTime = Math.min(Math.max(0, time), video.duration - 0.05);
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Lỗi xuất Blob từ Canvas'));
        }
      },
      mimeType,
      quality
    );
  });
}

