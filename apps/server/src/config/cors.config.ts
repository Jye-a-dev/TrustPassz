/**
 * src/config/cors.config.ts
 *
 * Strict Cross-Origin Resource Sharing (CORS) Security Policy (TASK-14).
 * Enforces:
 *   - Explicit origins in production from CORS_ALLOWED_ORIGINS
 *   - Development fallback to local clients (:5000, :5100, :3100) and LAN addresses
 *   - Safe rejection without unhandled 500 error: callback(null, false)
 *   - Safe allowance for origin-less requests (curl, server-to-server, mobile native)
 */

import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export function createCorsOptions(): CorsOptions {
  const isProd = process.env.NODE_ENV === 'production';

  // Base production origins + Capacitor mobile schemes
  const productionAllowedOrigins = [
    'https://trustpassz.vercel.app',
    'https://www.trustpassz.io',
    'https://trustpassz.io',
    'capacitor://localhost',
    'http://localhost',
    'https://localhost',
  ];

  const devAllowedOrigins = [
    ...productionAllowedOrigins,
    'http://localhost:5000', // cl_user dev web
    'http://localhost:5100', // cl_admin dev web
    'http://localhost:3100', // ai_pipeline FastAPI
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

      // 3. Local LAN IP regex matching (strictly active in development only)
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

      // 4. Safely reject disallowed origins without throwing a 500 error
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  };
}
