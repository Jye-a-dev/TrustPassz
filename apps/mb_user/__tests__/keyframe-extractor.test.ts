/**
 * TrustPassz Mobile - Keyframe Extractor Test Suite
 * Simulates video decoding, measures memory cleanup lifecycle,
 * and validates 512x512 RGB normalization and < 200KB compression.
 */

import {
  extractKeyframesFromVideo,
  revokeKeyframes,
  STANDARD_MILESTONES,
  MAX_DIMENSION,
  KeyframeExtractionError,
} from '../src/services/keyframe-extractor';

describe('Keyframe Extractor & Memory Guard (TASK-b-09)', () => {
  let createdObjectUrls: string[] = [];
  let revokedObjectUrls: string[] = [];

  let mockVideo: {
    duration: number;
    videoWidth: number;
    videoHeight: number;
    currentTime: number;
    readyState: number;
    src: string;
    pause: jest.Mock;
    load: jest.Mock;
    removeAttribute: jest.Mock;
    addEventListener: jest.Mock;
    removeEventListener: jest.Mock;
  };

  let mockCtx: {
    fillStyle: string;
    fillRect: jest.Mock;
    drawImage: jest.Mock;
    clearRect: jest.Mock;
  };

  let mockCanvas: {
    width: number;
    height: number;
    getContext: jest.Mock;
    toBlob: jest.Mock;
  };

  beforeEach(() => {
    createdObjectUrls = [];
    revokedObjectUrls = [];

    // Mock URL.createObjectURL and URL.revokeObjectURL
    (global as unknown as { URL: Record<string, unknown> }).URL = {
      createObjectURL: jest.fn((blob: Blob | File) => {
        const url = `blob:trustpassz-memory://${Math.random().toString(36).slice(2, 9)}`;
        createdObjectUrls.push(url);
        return url;
      }),
      revokeObjectURL: jest.fn((url: string) => {
        revokedObjectUrls.push(url);
      }),
    };

    // Mock Canvas Context 2D
    mockCtx = {
      fillStyle: '',
      fillRect: jest.fn(),
      drawImage: jest.fn(),
      clearRect: jest.fn(),
    };

    // Mock HTMLCanvasElement
    mockCanvas = {
      width: 0,
      height: 0,
      getContext: jest.fn((contextId: string, options?: unknown) => {
        if (contextId === '2d') return mockCtx;
        return null;
      }),
      toBlob: jest.fn((callback: (b: Blob) => void, mime: string, quality: number) => {
        // Mock a 52 KB compressed WebP blob
        const mockBlob = new Blob([new Uint8Array(52 * 1024)], { type: mime || 'image/webp' });
        callback(mockBlob);
      }),
    };

    // Mock HTMLVideoElement
    mockVideo = {
      duration: 30, // 30 seconds evidence video
      videoWidth: 1920,
      videoHeight: 1080,
      currentTime: 0,
      readyState: 4,
      src: '',
      pause: jest.fn(),
      load: jest.fn(),
      removeAttribute: jest.fn(),
      addEventListener: jest.fn(
        (event: string, handler: () => void, _opts?: { once?: boolean }) => {
          if (event === 'loadedmetadata') {
            setTimeout(handler, 0);
          }
        },
      ),
      removeEventListener: jest.fn(),
    };

    // Mock document.createElement
    (global as unknown as { document: Record<string, unknown> }).document = {
      createElement: jest.fn((tagName: string) => {
        if (tagName === 'video') {
          // Trigger seeked automatically when currentTime changes
          const videoProxy = new Proxy(mockVideo, {
            set(target, prop, value) {
              if (prop === 'currentTime') {
                target.currentTime = value as number;
                setTimeout(() => {
                  const calls = target.addEventListener.mock.calls;
                  for (const [event, cb] of calls) {
                    if (event === 'seeked') cb();
                  }
                }, 5);
              } else if (prop === 'src') {
                target.src = value as string;
              }
              return true;
            },
          });
          return videoProxy;
        }
        if (tagName === 'canvas') {
          return mockCanvas;
        }
        return {};
      }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('1. Trích xuất chính xác 3 khung hình tại các mốc 20%, 50%, và 80% thời lượng', async () => {
    const mockFile = new File([new Uint8Array(1024)], 'evidence.mp4', { type: 'video/mp4' });
    const progressUpdates: number[] = [];

    const keyframes = await extractKeyframesFromVideo(mockFile, {
      onProgress: (p) => progressUpdates.push(p),
    });

    // Acceptance Criteria 1: Exactly 3 keyframes
    expect(keyframes).toHaveLength(3);

    // Milestones check: 20%, 50%, 80%
    expect(keyframes[0]?.percentage).toBe(20);
    expect(keyframes[1]?.percentage).toBe(50);
    expect(keyframes[2]?.percentage).toBe(80);

    // 30s duration -> 20% = 6.0s, 50% = 15.0s, 80% = 24.0s
    expect(keyframes[0]?.timestamp).toBeCloseTo(6.0, 1);
    expect(keyframes[1]?.timestamp).toBeCloseTo(15.0, 1);
    expect(keyframes[2]?.timestamp).toBeCloseTo(24.0, 1);

    // Progress updates tracking
    expect(progressUpdates).toContain(100);
  });

  it('2. Chuẩn hóa kích thước 512x512 RGB và duy trì tỉ lệ khung hình (Letterboxing)', async () => {
    const mockFile = new File([new Uint8Array(1024)], 'unboxing.mp4', { type: 'video/mp4' });

    const keyframes = await extractKeyframesFromVideo(mockFile, {
      aspectMode: 'letterbox',
    });

    expect(keyframes).toHaveLength(3);

    // Output dimension check
    for (const kf of keyframes) {
      expect(kf.width).toBe(MAX_DIMENSION);
      expect(kf.height).toBe(MAX_DIMENSION);
    }

    // Verify context2D initialized with willReadFrequently: true
    expect(mockCanvas.getContext).toHaveBeenCalledWith('2d', { willReadFrequently: true });

    // Verify Letterbox background filled with #000000
    expect(mockCtx.fillStyle).toBe('#000000');
    expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 512, 512);

    // For 1920x1080 -> scale = 512 / 1920 = 0.2667
    // drawWidth = 512, drawHeight = 288, offsetY = (512 - 288) / 2 = 112
    expect(mockCtx.drawImage).toHaveBeenCalledWith(
      expect.anything(),
      0,
      0,
      1920,
      1080,
      0,
      112,
      512,
      288,
    );
  });

  it('3. Đảm bảo dung lượng mỗi ảnh nén < 200KB (thực tế 52KB)', async () => {
    const mockFile = new File([new Uint8Array(1024)], 'asset_inspection.mp4', {
      type: 'video/mp4',
    });

    const keyframes = await extractKeyframesFromVideo(mockFile);

    for (const kf of keyframes) {
      expect(kf.sizeBytes).toBeLessThan(200 * 1024);
      expect(kf.sizeBytes).toBe(52 * 1024);
      expect(kf.sizeFormatted).toBe('52 KB');
      expect(kf.mimeType).toBe('image/webp');
    }
  });

  it('4. Quy trình dọn dẹp TRIỆT ĐỂ rò rỉ bộ nhớ (Zero Memory Leak Lifecycle)', async () => {
    const mockFile = new File([new Uint8Array(1024)], 'evidence_4k.mp4', { type: 'video/mp4' });

    const keyframes = await extractKeyframesFromVideo(mockFile);

    // Step A: Source Object URL revoked immediately
    const sourceVideoUrl = createdObjectUrls[0];
    expect(sourceVideoUrl).toBeDefined();
    expect(revokedObjectUrls).toContain(sourceVideoUrl);

    // Step B: Hardware Video element paused & references stripped
    expect(mockVideo.pause).toHaveBeenCalled();
    expect(mockVideo.removeAttribute).toHaveBeenCalledWith('src');
    expect(mockVideo.load).toHaveBeenCalled();

    // Step C: Canvas backing store cleared & dimensions reset to 0
    expect(mockCtx.clearRect).toHaveBeenCalled();
    expect(mockCanvas.width).toBe(0);
    expect(mockCanvas.height).toBe(0);

    // Step D: Revoking keyframe preview URLs works cleanly
    revokeKeyframes(keyframes);
    for (const kf of keyframes) {
      expect(revokedObjectUrls).toContain(kf.previewUrl);
    }
  });

  it('5. Đảm bảo Cleanup luôn giải phóng tài nguyên trong block finally ngay cả khi lỗi', async () => {
    // Simulate corrupted video with 0 duration
    mockVideo.duration = 0;
    mockVideo.readyState = 1;

    const mockCorruptFile = new File([new Uint8Array(512)], 'corrupted.mp4', {
      type: 'video/mp4',
    });

    await expect(extractKeyframesFromVideo(mockCorruptFile)).rejects.toThrow(
      KeyframeExtractionError,
    );

    // Verify cleanup ran in finally
    expect(revokedObjectUrls.length).toBeGreaterThanOrEqual(1);
    expect(mockVideo.pause).toHaveBeenCalled();
    expect(mockVideo.removeAttribute).toHaveBeenCalledWith('src');
    expect(mockVideo.load).toHaveBeenCalled();
  });
});

