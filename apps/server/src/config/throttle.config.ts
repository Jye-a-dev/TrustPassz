/**
 * src/config/throttle.config.ts
 *
 * Centralized Rate Limiting & DDOS Protection Configuration (TASK-14 & TASK-a-10).
 * Dynamic configuration via ConfigService / process.env:
 *   - Global default: THROTTLE_LIMIT (default 120 req / 60s)
 *   - Auth endpoints (/api/v1/auth/*): THROTTLE_AUTH_LIMIT (default 10 req / 60s)
 *   - Payment webhook (/api/v1/payments/webhook): THROTTLE_WEBHOOK_LIMIT (default 60 req / 60s)
 *   - Deals endpoints: THROTTLE_DEALS_LIMIT (default 20 req / 60s)
 */

import { ConfigService } from '@nestjs/config';
import { ThrottlerModuleOptions } from '@nestjs/throttler';

function resolveTtlMs(
  ttlSecOrMs?: string | number,
  fallbackSec = 60,
): number {
  if (ttlSecOrMs === undefined || ttlSecOrMs === '') {
    return fallbackSec * 1000;
  }
  const val = Number(ttlSecOrMs);
  if (Number.isNaN(val) || val <= 0) return fallbackSec * 1000;
  // If value <= 1000, consider it seconds and convert to ms
  return val <= 1000 ? val * 1000 : val;
}

export const THROTTLE_CONFIG = {
  get ttlMs(): number {
    return (
      (process.env.THROTTLE_TTL_MS
        ? parseInt(process.env.THROTTLE_TTL_MS, 10)
        : undefined) ??
      resolveTtlMs(process.env.THROTTLE_TTL, 60)
    );
  },
  get defaultLimit(): number {
    const isDev = process.env.NODE_ENV !== 'production';
    return parseInt(
      process.env.THROTTLE_LIMIT ||
        process.env.THROTTLE_DEFAULT_LIMIT ||
        (isDev ? '300' : '120'),
      10,
    );
  },
  get authLimit(): number {
    return parseInt(process.env.THROTTLE_AUTH_LIMIT || '10', 10);
  },
  get authTtlMs(): number {
    return resolveTtlMs(process.env.THROTTLE_AUTH_TTL, 60);
  },
  get webhookLimit(): number {
    return parseInt(process.env.THROTTLE_WEBHOOK_LIMIT || '60', 10);
  },
  get webhookTtlMs(): number {
    return resolveTtlMs(process.env.THROTTLE_WEBHOOK_TTL, 60);
  },
  get dealsWriteLimit(): number {
    return parseInt(
      process.env.THROTTLE_DEALS_LIMIT ||
        process.env.THROTTLE_DEALS_WRITE_LIMIT ||
        '20',
      10,
    );
  },
  get dealsLimit(): number {
    return this.dealsWriteLimit;
  },
  get dealsTtlMs(): number {
    return resolveTtlMs(process.env.THROTTLE_DEALS_TTL, 60);
  },
};

export function getThrottlerOptions(
  configService?: ConfigService,
): ThrottlerModuleOptions {
  const get = (key: string, fallback?: string): string | undefined => {
    return (
      (configService ? configService.get<string>(key) : process.env[key]) ||
      fallback
    );
  };

  const ttlMs =
    (get('THROTTLE_TTL_MS') ? parseInt(get('THROTTLE_TTL_MS')!, 10) : undefined) ??
    resolveTtlMs(get('THROTTLE_TTL'), 60);

  const isDev = (get('NODE_ENV') || process.env.NODE_ENV) !== 'production';
  const defaultLimit = parseInt(
    get('THROTTLE_LIMIT', get('THROTTLE_DEFAULT_LIMIT', isDev ? '300' : '120'))!,
    10,
  );
  const authLimit = parseInt(get('THROTTLE_AUTH_LIMIT', '10')!, 10);
  const authTtlMs = resolveTtlMs(get('THROTTLE_AUTH_TTL'), ttlMs / 1000);

  const webhookLimit = parseInt(get('THROTTLE_WEBHOOK_LIMIT', '60')!, 10);
  const webhookTtlMs = resolveTtlMs(get('THROTTLE_WEBHOOK_TTL'), ttlMs / 1000);

  const dealsLimit = parseInt(
    get('THROTTLE_DEALS_LIMIT', get('THROTTLE_DEALS_WRITE_LIMIT', '20'))!,
    10,
  );
  const dealsTtlMs = resolveTtlMs(get('THROTTLE_DEALS_TTL'), ttlMs / 1000);

  return [
    {
      name: 'default',
      ttl: ttlMs,
      limit: defaultLimit,
    },
    {
      name: 'auth',
      ttl: authTtlMs,
      limit: authLimit,
    },
    {
      name: 'webhook',
      ttl: webhookTtlMs,
      limit: webhookLimit,
    },
    {
      name: 'deals',
      ttl: dealsTtlMs,
      limit: dealsLimit,
    },
    {
      name: 'dealsWrite',
      ttl: dealsTtlMs,
      limit: dealsLimit,
    },
  ];
}

export const throttlerAsyncOptions: ThrottlerModuleOptions =
  getThrottlerOptions();
