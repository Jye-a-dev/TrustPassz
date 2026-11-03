import { Injectable, Logger } from '@nestjs/common';
import { CacheMetadata } from './interfaces/analytics.interface';

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  expiresAt: number;
}

@Injectable()
export class AnalyticsCacheService {
  private readonly logger = new Logger(AnalyticsCacheService.name);
  private readonly cacheStore = new Map<string, CacheEntry<unknown>>();
  private readonly pendingPromises = new Map<string, Promise<unknown>>();
  private readonly DEFAULT_TTL_MS = 60 * 1000; // 60 seconds

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = this.DEFAULT_TTL_MS,
  ): Promise<{ data: T; metadata: CacheMetadata }> {
    const now = Date.now();
    const existing = this.cacheStore.get(key) as CacheEntry<T> | undefined;

    if (existing && existing.expiresAt > now) {
      return {
        data: existing.data,
        metadata: {
          cachedAt: new Date(existing.cachedAt).toISOString(),
          expiresAt: new Date(existing.expiresAt).toISOString(),
          ttlSeconds: Math.round((existing.expiresAt - now) / 1000),
          isStale: false,
        },
      };
    }

    // Coalesce concurrent requests for same key to avoid cache stampede
    if (this.pendingPromises.has(key)) {
      const data = (await this.pendingPromises.get(key)) as T;
      return {
        data,
        metadata: {
          cachedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + ttlMs).toISOString(),
          ttlSeconds: Math.round(ttlMs / 1000),
          isStale: false,
        },
      };
    }

    const fetchPromise = (async () => {
      try {
        const freshData = await fetcher();
        const entry: CacheEntry<T> = {
          data: freshData,
          cachedAt: Date.now(),
          expiresAt: Date.now() + ttlMs,
        };
        this.cacheStore.set(key, entry);
        return freshData;
      } finally {
        this.pendingPromises.delete(key);
      }
    })();

    this.pendingPromises.set(key, fetchPromise);
    const result = await fetchPromise;

    return {
      data: result,
      metadata: {
        cachedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + ttlMs).toISOString(),
        ttlSeconds: Math.round(ttlMs / 1000),
        isStale: false,
      },
    };
  }

  invalidate(keyPattern?: string): void {
    if (!keyPattern) {
      this.cacheStore.clear();
      this.logger.log('All analytics caches invalidated');
      return;
    }

    let clearedCount = 0;
    for (const key of this.cacheStore.keys()) {
      if (key.includes(keyPattern)) {
        this.cacheStore.delete(key);
        clearedCount++;
      }
    }
    this.logger.log(
      `Invalidated ${clearedCount} analytics cache entries matching pattern "${keyPattern}"`,
    );
  }
}

