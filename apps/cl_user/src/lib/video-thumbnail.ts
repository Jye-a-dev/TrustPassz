/**
 * Client-Side Video Thumbnail Extractor via HTML5 Video & Canvas API.
 * TrustPassz Escrow Platform - TASK-b-15
 */

export interface VideoThumbnailResult {
  thumbnailUrl: string;
  duration: number;
  width: number;
  height: number;
}

/**
 * Extracts a high-resolution snapshot frame from an uploaded video file.
 * Automatically cleans up DOM elements and Object URLs to prevent memory leaks.
 */
export async function generateVideoThumbnail(
  file: File,
  seekTimeSeconds = 1.0,
  maxCanvasWidth = 640
): Promise<VideoThumbnailResult> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return reject(
        new Error("Video thumbnail generator requires a browser DOM environment.")
      );
    }

    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);
    let isTerminated = false;

    const cleanup = () => {
      if (isTerminated) return;
      isTerminated = true;
      video.pause();
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(objectUrl);
    };

    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.src = objectUrl;

    // Timeout guard: 8 seconds maximum
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Quá thời gian trích xuất thumbnail từ video."));
    }, 8000);

    video.onloadedmetadata = () => {
      const dur = video.duration || 0;
      const targetTime =
        dur > 0 ? Math.min(seekTimeSeconds, Math.max(0, dur / 2)) : 0;
      video.currentTime = targetTime;
    };

    video.onseeked = () => {
      clearTimeout(timer);
      try {
        const naturalWidth = video.videoWidth || 640;
        const naturalHeight = video.videoHeight || 360;
        const scale = Math.min(1, maxCanvasWidth / naturalWidth);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(naturalHeight * scale));

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) {
          cleanup();
          return reject(new Error("Không thể khởi tạo Canvas 2D Context."));
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.85);
        const duration = video.duration || 0;

        cleanup();
        resolve({
          thumbnailUrl,
          duration,
          width: naturalWidth,
          height: naturalHeight,
        });
      } catch (err) {
        cleanup();
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };

    video.onerror = () => {
      clearTimeout(timer);
      cleanup();
      reject(new Error("Không thể giải mã video để trích xuất thumbnail."));
    };
  });
}

