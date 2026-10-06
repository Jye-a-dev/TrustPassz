/**
 * src/config/cors.config.ts
 *
 * Strict Cross-Origin Resource Sharing (CORS) Security Policy.
 * Whitelists:
 *   - Production Vercel domains for cl_user & cl_admin
 *   - Capacitor native mobile scheme (capacitor://localhost)
 *   - Configurable origins via CORS_ALLOWED_ORIGINS environment variable
 *   - Local development hosts (:3000, :3001, :5000, :5100, :3100)
 */

import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export function createCorsOptions(): CorsOptions {
  const isProd = process.env.NODE_ENV === 'production';

  // Base production origins + Capacitor mobile schemes
  const productionAllowedOrigins = [
    'https://trustpassz.vercel.app',
    'https://trustpassz-cl-user.vercel.app',
    'https://trustpassz-cl-admin.vercel.app',
    'https://trustpassz-user.vercel.app',
    'https://trustpassz-admin.vercel.app',
    'https://www.trustpassz.io',
    'https://trustpassz.io',
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
  ];

  // Additional custom origins from environment
  const envOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const allowedOrigins = new Set(
    isProd
      ? [...productionAllowedOrigins, ...envOrigins]
      : [...devAllowedOrigins, ...envOrigins],
  );

  return {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ): void => {
      // 1. Allow requests with no origin (curl, server-to-server webhooks, native mobile)
      if (!origin) {
        callback(null, true);
        return;
      }

      // 2. Exact match in configured origin whitelist
      if (allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      // 3. Dynamic match for Vercel preview/production deployments (cl_user, cl_admin)
      const isTrustPasszVercel = /^https:\/\/(?:[a-z0-9-]+\.)?vercel\.app$/.test(origin) &&
        (origin.includes('trustpassz') || origin.includes('cl-user') || origin.includes('cl-admin'));
      if (isTrustPasszVercel) {
        callback(null, true);
        return;
      }

      // 4. Local LAN IP regex matching (strictly active in development only)
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

      // 5. Safely reject disallowed origins without throwing an unhandled 500 error
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Idempotency-Key',
      'idempotency-key',
      'X-Idempotency-Key',
      'x-idempotency-key',
      'X-Requested-With',
      'Origin',
    ],
    exposedHeaders: [
      'Idempotency-Key',
      'idempotency-key',
      'X-Idempotency-Key',
      'x-idempotency-key',
    ],
  };
}
