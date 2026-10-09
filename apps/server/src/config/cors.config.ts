/**
 * src/config/cors.config.ts
 *
 * Strict Cross-Origin Resource Sharing (CORS) Security Policy (TASK-14 & TASK-a-10).
 * Whitelists:
 *   - Production & preview domains for cl_user & cl_admin
 *   - Native mobile schemes (capacitor://localhost)
 *   - Configurable origins via CORS_ALLOWED_ORIGINS environment variable
 *   - Local development hosts (:3000, :3001, :5000, :5100, :3100)
 *
 * Security Enforcement:
 *   - Strictly blocks wildcard `*` on Staging and Production environments.
 */

import { ConfigService } from '@nestjs/config';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export function createCorsOptions(configService?: ConfigService): CorsOptions {
  const nodeEnv =
    (configService
      ? configService.get<string>('NODE_ENV')
      : process.env.NODE_ENV) || 'development';
  const isProd = nodeEnv === 'production' || nodeEnv === 'staging';

  // Base production origins + Capacitor mobile schemes
  const productionAllowedOrigins = [
    'https://trustpassz.vercel.app',
    'https://trustpassz-cl-user.vercel.app',
    'https://trustpassz-cl-admin.vercel.app',
    'https://trustpassz-user.vercel.app',
    'https://trustpassz-admin.vercel.app',
    'https://trustpassz-cl-admin.pages.dev',
    'https://trustpassz-cl-user.pages.dev',
    'https://trustpassz.pages.dev',
    'https://admin.trustpassz.io',
    'https://www.trustpassz.io',
    'https://trustpassz.io',
    'https://admin.trustpassz.com',
    'https://www.trustpassz.com',
    'https://trustpassz.com',
    'capacitor://localhost',
    'http://localhost',
    'https://localhost',
  ];

  const devAllowedOrigins = [
    ...productionAllowedOrigins,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5000',
    'http://localhost:5100',
    'http://localhost:3100',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5000',
    'http://127.0.0.1:5100',
    'http://127.0.0.1:3100',
  ];

  // Dynamic custom origins from environment variable
  const rawEnvOrigins = (
    configService
      ? configService.get<string>('CORS_ALLOWED_ORIGINS')
      : process.env.CORS_ALLOWED_ORIGINS
  ) || '';

  const parsedEnvOrigins = rawEnvOrigins
    .split(',')
    .map((o) => o.trim())
    .filter((o) => {
      if (!o) return false;
      // Strictly reject wildcard '*' on Staging / Production
      if (isProd && o === '*') {
        return false;
      }
      return true;
    });

  const baseOrigins = isProd ? productionAllowedOrigins : devAllowedOrigins;
  const allowedOrigins = new Set<string>([...baseOrigins, ...parsedEnvOrigins]);

  return {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ): void => {
      // 1. Allow server-to-server webhooks, curl, and native mobile requests with no origin header
      if (!origin) {
        callback(null, true);
        return;
      }

      // 2. Reject wildcard '*' explicitly if passed as origin in Staging / Production
      if (isProd && (origin === '*' || origin === 'null')) {
        callback(null, false);
        return;
      }

      // 3. Exact match against configured origin whitelist
      if (allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      // 4. Dynamic match for official TrustPassz custom domains (*.trustpassz.io, *.trustpassz.com, *.trustpassz.dev)
      const isTrustPasszDomain =
        /^https:\/\/(?:[a-z0-9-_.]+\.)?trustpassz\.(?:io|com|dev)$/i.test(
          origin,
        );
      if (isTrustPasszDomain) {
        callback(null, true);
        return;
      }

      // 5. Dynamic match for Vercel & Cloudflare verified previews (cl_user, cl_admin)
      const isTrustPasszDeploy =
        /^https:\/\/[a-z0-9-_.]*(?:vercel\.app|pages\.dev|workers\.dev)$/i.test(
          origin,
        ) &&
        (origin.includes('trustpassz') ||
          origin.includes('admin') ||
          origin.includes('cl-user'));
      if (isTrustPasszDeploy) {
        callback(null, true);
        return;
      }

      // 6. Local development IP and subnet regex (development only)
      if (!isProd) {
        const isLanDevOrigin =
          /^https?:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(
            origin,
          );
        if (isLanDevOrigin) {
          callback(null, true);
          return;
        }
      }

      // 7. Reject unauthorized origins without throwing 500 error
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Cookie',
      'Idempotency-Key',
      'idempotency-key',
      'X-Idempotency-Key',
      'x-idempotency-key',
      'X-Requested-With',
      'Origin',
    ],
    exposedHeaders: [
      'Retry-After',
      'retry-after',
      'Idempotency-Key',
      'idempotency-key',
      'X-Idempotency-Key',
      'x-idempotency-key',
    ],
  };
}
