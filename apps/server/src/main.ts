import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import './common/utils/bigint-serializer.util';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // FIX C2: Parse cookies so AuthGuard can read httpOnly access_token cookie
  app.use(cookieParser());

  // CORS — allow all local dev ports + production origins + mobile clients (LAN IP & expo)
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:4000',
    'http://localhost:5000', // cl_user dev server
    'http://localhost:5001',
    'http://localhost:5100', // cl_admin dev server
    'http://localhost:6000',
    'http://localhost:8081', // Metro bundler
    'http://localhost:19000',
    'http://localhost:19006',
    'https://trustpassz.vercel.app',
    'https://www.trustpassz.io',
    'https://trustpassz.io',
  ];

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ): void => {
      // Allow requests with no origin (curl, Postman, server-to-server, mobile native apps)
      if (!origin) {
        callback(null, true);
        return;
      }
      if (
        allowedOrigins.includes(origin) ||
        /^https?:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(
          origin,
        ) ||
        origin.startsWith('exp://')
      ) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Configure OpenAPI 3.0 / Swagger Interactive Test Harness
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
        description: 'Enter JWT bearer token obtained from /api/v1/auth/verify',
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

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  await app.listen(port, '0.0.0.0');

  logger.log(`Application is running on: http://0.0.0.0:${port}`);
  logger.log(`Swagger UI available at: http://0.0.0.0:${port}/docs`);
}

void bootstrap();
