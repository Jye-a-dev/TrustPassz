/**
 * src/config/throttle.config.ts
 *
 * Centralized Rate Limiting & Throttling Configuration (TASK-14).
 * Enforces differentiated rate limits across public/sensitive routes:
 *   - Global default: 120 req / 60s
 *   - Auth endpoints (/api/v1/auth/*): 10 req / 60s (brute-force defense)
 *   - Payment webhook (/api/v1/payments/webhook): 60 req / 60s (PayOS retries)
 *   - Deals write endpoints (POST, PATCH, DELETE, settle, unlock): 20 req / 60s
 */

import { ThrottlerModuleOptions } from '@nestjs/throttler';

export const THROTTLE_CONFIG = {
  ttlMs: parseInt(process.env.THROTTLE_TTL_MS || '60000', 10),
  defaultLimit: parseInt(process.env.THROTTLE_DEFAULT_LIMIT || '120', 10),
  authLimit: parseInt(process.env.THROTTLE_AUTH_LIMIT || '10', 10),
  webhookLimit: parseInt(process.env.THROTTLE_WEBHOOK_LIMIT || '60', 10),
  dealsWriteLimit: parseInt(process.env.THROTTLE_DEALS_WRITE_LIMIT || '20', 10),
};

export const throttlerAsyncOptions: ThrottlerModuleOptions = [
  {
    name: 'default',
    ttl: THROTTLE_CONFIG.ttlMs,
    limit: THROTTLE_CONFIG.defaultLimit,
  },
  {
    name: 'auth',
    ttl: THROTTLE_CONFIG.ttlMs,
    limit: THROTTLE_CONFIG.authLimit,
  },
  {
    name: 'webhook',
    ttl: THROTTLE_CONFIG.ttlMs,
    limit: THROTTLE_CONFIG.webhookLimit,
  },
  {
    name: 'dealsWrite',
    ttl: THROTTLE_CONFIG.ttlMs,
    limit: THROTTLE_CONFIG.dealsWriteLimit,
  },
];
