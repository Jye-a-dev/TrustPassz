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

      // 3. Dynamic match for TrustPassz custom domains (*.trustpassz.io, *.trustpassz.com)
      const isTrustPasszDomain = /^https:\/\/(?:[a-z0-9-_.]+\.)?trustpassz\.(?:io|com|dev)$/i.test(origin);
      if (isTrustPasszDomain) {
        callback(null, true);
        return;
      }

      // 4. Dynamic match for Vercel & Cloudflare deployments (cl_user, cl_admin)
      const isTrustPasszDeploy =
        /^https:\/\/[a-z0-9-_.]*(?:vercel\.app|pages\.dev|workers\.dev)$/i.test(origin) &&
        (origin.includes('trustpassz') || origin.includes('admin') || origin.includes('cl-user'));
      if (isTrustPasszDeploy) {
        callback(null, true);
        return;
      }

      // 5. Local LAN IP regex matching (strictly active in development only)
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

      // 6. Safely reject disallowed origins without throwing an unhandled 500 error
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
      'Idempotency-Key',
      'idempotency-key',
      'X-Idempotency-Key',
      'x-idempotency-key',
    ],
  };
}
