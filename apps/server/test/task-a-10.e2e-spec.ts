/// <reference types="jest" />
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { KeepAliveService } from '../src/keep-alive/keep-alive.service';
import { createCorsOptions } from '../src/config/cors.config';
import { THROTTLE_CONFIG } from '../src/config/throttle.config';

describe('TASK-a-10: Anti-Idle Keep-Alive, Security Hardening & Resiliency', () => {
  let app: INestApplication<App>;
  let keepAliveService: KeepAliveService;

  const mockPrismaService = {
    $queryRaw: jest.fn().mockResolvedValue([{ ping: 1 }]),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.enableCors(createCorsOptions());
    await app.init();

    keepAliveService = moduleFixture.get<KeepAliveService>(KeepAliveService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Anti-Idle Keep-Alive Service (Neon PostgreSQL & Health Probes)', () => {
    it('should execute lightweight query (SELECT 1;) to keep Neon PostgreSQL active', async () => {
      const dbResult = await keepAliveService.pingNeonDatabase();
      expect(dbResult.success).toBe(true);
      expect(dbResult.latencyMs).toBeGreaterThanOrEqual(0);
      expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
    });

    it('should gracefully handle ping failures without crashing Node.js process', async () => {
      mockPrismaService.$queryRaw.mockRejectedValueOnce(
        new Error('Neon connection timeout'),
      );
      const dbResult = await keepAliveService.pingNeonDatabase();
      expect(dbResult.success).toBe(false);
      expect(dbResult.error).toContain('Neon connection timeout');
    });

    it('should expose GET /api/v1/keep-alive/status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/keep-alive/status')
        .expect(200);

      expect(res.body.status).toBe('active');
    });

    it('should execute manual keep-alive cycle via POST /api/v1/keep-alive/trigger', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/keep-alive/trigger')
        .expect(200);

      expect(res.body.status).toBe('executed');
      expect(res.body.report.database.success).toBe(true);
    });
  });

  describe('2. Security Hardening & Rate Limiting (Throttler & Retry-After)', () => {
    it('should return HTTP 429 with standard Retry-After header when rate limit is exceeded', async () => {
      const server = app.getHttpServer();
      const limit = THROTTLE_CONFIG.authLimit;

      // Exhaust all tokens within the configured auth rate limit window
      for (let i = 0; i < limit; i++) {
        await request(server).get('/api/v1/auth/nonce').expect(200);
      }

      // Next request must strictly trigger rate limit (HTTP 429 Too Many Requests)
      const throttledRes = await request(server)
        .get('/api/v1/auth/nonce')
        .expect(429);

      // Verify HTTP standard Retry-After header is returned
      const retryAfter = throttledRes.headers['retry-after'];
      expect(retryAfter).toBeDefined();
      expect(Number(retryAfter)).toBeGreaterThan(0);
    });
  });

  describe('3. Dynamic CORS Whitelist & Wildcard Enforcement', () => {
    it('should allow requests from whitelisted production domain', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/health')
        .set('Origin', 'https://trustpassz.vercel.app');

      expect(res.headers['access-control-allow-origin']).toBe(
        'https://trustpassz.vercel.app',
      );
    });

    it('should allow requests from whitelisted local development client', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/health')
        .set('Origin', 'http://localhost:3000');

      expect(res.headers['access-control-allow-origin']).toBe(
        'http://localhost:3000',
      );
    });

    it('should reject unauthorized / rogue origins without CORS headers', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/health')
        .set('Origin', 'https://malicious-phishing-site.com');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('should strictly disallow wildcard "*" origin in production options', () => {
      const originalEnv = process.env.NODE_ENV;
      const originalOrigins = process.env.CORS_ALLOWED_ORIGINS;

      try {
        process.env.NODE_ENV = 'production';
        process.env.CORS_ALLOWED_ORIGINS = 'https://valid.com, *';

        const corsOptions = createCorsOptions();
        const originFn = corsOptions.origin as (
          origin: string | undefined,
          cb: (err: Error | null, allow?: boolean) => void,
        ) => void;

        let wildcardAllowed: boolean | undefined = undefined;
        originFn('*', (_err, allow) => {
          wildcardAllowed = allow;
        });

        expect(wildcardAllowed).toBe(false);
      } finally {
        process.env.NODE_ENV = originalEnv;
        process.env.CORS_ALLOWED_ORIGINS = originalOrigins;
      }
    });
  });
});

