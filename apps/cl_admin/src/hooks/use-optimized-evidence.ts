'use client';

import * as React from 'react';

interface CacheEntry {
  url: string;
  expiresAt: number;
}

const GLOBAL_URL_CACHE = new Map<string, CacheEntry>();
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

const BLUR_PLACEHOLDER_DATA_URI =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">' +
      '<rect width="400" height="300" fill="#0B0F17"/>' +
      '<rect x="20" y="20" width="360" height="260" rx="8" fill="#0F172A" stroke="#1E293B" stroke-width="2"/>' +
      '<circle cx="200" cy="150" r="24" fill="#06B6D4" opacity="0.15"/>' +
      '<path d="M190 150h20M200 140v20" stroke="#06B6D4" stroke-width="2" stroke-linecap="round"/>' +
      '</svg>'
  );

export function useOptimizedEvidence(bucket: string = 'dispute-evidences') {
  const [loadedMap, setLoadedMap] = React.useState<Record<string, boolean>>({});
  const blobUrlsRef = React.useRef<Set<string>>(new Set());

  const getMediaUrl = React.useCallback(
    (rawPathOrUrl: string): string => {
      if (!rawPathOrUrl) return '';

      const now = Date.now();
      const cached = GLOBAL_URL_CACHE.get(rawPathOrUrl);
      if (cached && cached.expiresAt > now) {
        return cached.url;
      }

      let resolved = rawPathOrUrl;
      if (!rawPathOrUrl.startsWith('http://') && !rawPathOrUrl.startsWith('https://')) {
        const cleanPath = rawPathOrUrl.replace(/^\/+/, '');
        const supabaseBase =
          process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://eixscrzogbnjrwfbcqst.supabase.co';
        resolved = `${supabaseBase}/storage/v1/object/public/${bucket}/${cleanPath}`;
      }

      GLOBAL_URL_CACHE.set(rawPathOrUrl, {
        url: resolved,
        expiresAt: now + DEFAULT_TTL_MS,
      });

      return resolved;
    },
    [bucket]
  );

  const markAsLoaded = React.useCallback((idOrUrl: string) => {
    setLoadedMap((prev) => {
      if (prev[idOrUrl]) return prev;
      return { ...prev, [idOrUrl]: true };
    });
  }, []);

  const prefetchMedia = React.useCallback(
    (urls: string[]) => {
      if (typeof window === 'undefined') return;

      urls.forEach((u) => {
        if (!u) return;
        const targetUrl = getMediaUrl(u);
        const img = new Image();
        img.src = targetUrl;
        img.onload = () => markAsLoaded(u);
      });
    },
    [getMediaUrl, markAsLoaded]
  );

  const createBlobFromBuffer = React.useCallback((buffer: ArrayBuffer, mimeType: string): string => {
    const blob = new Blob([buffer], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);
    blobUrlsRef.current.add(blobUrl);
    return blobUrl;
  }, []);

  React.useEffect(() => {
    const currentBlobs = blobUrlsRef.current;
    return () => {
      currentBlobs.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore cleanup errors
        }
      });
      currentBlobs.clear();
    };
  }, []);

  return {
    getMediaUrl,
    markAsLoaded,
    loadedMap,
    prefetchMedia,
    createBlobFromBuffer,
    blurPlaceholder: BLUR_PLACEHOLDER_DATA_URI,
  };
}

