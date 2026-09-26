import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import './common/utils/bigint-serializer.util';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

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
    .addTag('Authentication (Passwordless & Web3)', 'Privy Passkey & Google OAuth token verification and JWT issue')
    .addTag('Users & Social Storefronts', 'User profile management and seller social-commerce storefronts')
    .addTag('Marketplace Products & Inventory', 'Product listings, pricing, specs, and bargain rule configurations')
    .addTag('Deals & Digital Vault', 'Escrow lifecycle state machine, encrypted digital asset vault, and access control')
    .addTag('Orders & Escrow Fulfillment', 'Purchase orders, physical/digital shipping tracking, and deal linkage')
    .addTag('Bargain & Dynamic Negotiation', 'Realtime buyer price bidding, seller accept/reject counter-offers')
    .addTag('Disputes & AI Arbitration', 'Dispute submission, evidence audit, AI confidence scoring, and admin resolution')
    .addTag('Payments & Payment Gateway Webhooks', 'PayOS checkout links and idempotent payment webhook reconciliation')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Swagger UI available at: http://localhost:${port}/docs`);
}

void bootstrap();
