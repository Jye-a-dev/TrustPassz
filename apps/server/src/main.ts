import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

// Pre-load environment variables before NestJS module resolution
const envCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'apps/server/.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env'),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

import net from 'net';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { createCorsOptions } from './config/cors.config';
import './common/utils/bigint-serializer.util';

/**
 * Resolves server listen port: strictly defaults to 3000 or accepts any available 30xx port (3000-3099).
 */
async function resolvePort(
  preferredPort = 3000,
  fallbackMax = 3099,
): Promise<number> {
  const isPortFree = (targetPort: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const tester = net.createServer();
      tester.once('error', () => resolve(false));
      tester.once('listening', () => {
        tester.close(() => resolve(true));
      });
      tester.listen(targetPort, '0.0.0.0');
    });
  };

  // 1. Try preferred port first
  if (await isPortFree(preferredPort)) {
    return preferredPort;
  }

  // 2. Scan through 30xx range (3000..3099)
  for (let candidate = 3000; candidate <= fallbackMax; candidate++) {
    if (candidate !== preferredPort && (await isPortFree(candidate))) {
      return candidate;
    }
  }

  return preferredPort;
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Trust upstream proxy when behind a Cloud Load Balancer / Reverse Proxy
  const trustProxyEnv = process.env.TRUST_PROXY;
  if (trustProxyEnv !== undefined && trustProxyEnv !== '') {
    const parsedProxy = /^\d+$/.test(trustProxyEnv)
      ? parseInt(trustProxyEnv, 10)
      : trustProxyEnv === 'true';
    app.set('trust proxy', parsedProxy);
  } else if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // Parse cookies so AuthGuard can read httpOnly access_token cookie
  app.use(cookieParser());

  // Enterprise Security Headers (TASK-15)
  app.use(
    (
      _req: unknown,
      res: { setHeader: (name: string, value: string) => void },
      next: () => void,
    ) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload',
      );
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      next();
    },
  );

  // Strict CORS Configuration (TASK-14)
  app.enableCors(createCorsOptions());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Configure OpenAPI 3.0 / Swagger (disabled in production unless ENABLE_SWAGGER=true)
  const isProd = process.env.NODE_ENV === 'production';
  const enableSwagger = process.env.ENABLE_SWAGGER === 'true';

  if (!isProd || enableSwagger) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('TrustPassz Unified Escrow & Social-Commerce API')
      .setDescription(
        'Toàn bộ module REST API của nền tảng TrustPassz: Xác thực Web3/OAuth, Người dùng & Storefront, Sản phẩm Marketplace, Hợp đồng ký quỹ Escrow & Digital Vault, Đơn hàng & Vận chuyển, Trả giá Realtime, Tranh chấp & Trọng tài AI, Cổng thanh toán & Webhook.',
      )
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          in: 'header',
          description:
            'Enter JWT bearer token obtained from /api/v1/auth/verify',
        },
        'JWT-auth',
      )
      .addTag('System & Health', 'Health check, system status ping')
      .addTag(
        'Authentication (Passwordless & Web3)',
        'Privy Passkey & Google OAuth token verification and JWT issue',
      )
      .addTag(
        'Users & Social Storefronts',
        'User profile management and seller social-commerce storefronts',
      )
      .addTag(
        'Marketplace Products & Inventory',
        'Product listings, pricing, specs, and bargain rule configurations',
      )
      .addTag(
        'Deals & Digital Vault',
        'Escrow lifecycle state machine, encrypted digital asset vault, and access control',
      )
      .addTag(
        'Orders & Escrow Fulfillment',
        'Purchase orders, physical/digital shipping tracking, and deal linkage',
      )
      .addTag(
        'Bargain & Dynamic Negotiation',
        'Realtime buyer price bidding, seller accept/reject counter-offers',
      )
      .addTag(
        'Disputes & AI Arbitration',
        'Dispute submission, evidence audit, AI confidence scoring, and admin resolution',
      )
      .addTag(
        'Payments & Payment Gateway Webhooks',
        'PayOS checkout links and idempotent payment webhook reconciliation',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'list',
      },
    });
  }

  const configuredPort = process.env.PORT
    ? parseInt(process.env.PORT, 10)
    : 3000;
  const port = await resolvePort(configuredPort, 3099);
  await app.listen(port, '0.0.0.0');

  logger.log(`Application is running on: http://0.0.0.0:${port}`);
  if (!isProd || enableSwagger) {
    logger.log(`Swagger UI available at: http://0.0.0.0:${port}/docs`);
  }
}

void bootstrap();
