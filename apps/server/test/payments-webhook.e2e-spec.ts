/// <reference types="jest" />
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DealState, OrderStatus, Prisma } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import '../src/common/utils/bigint-serializer.util';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { JwtService } from '../src/modules/auth/jwt.service';
import {
  createPaymentsWebhookPrismaMock,
  generatePaymentSignature,
} from './mocks/payments-webhook.mock';

describe('Payments & Webhooks (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let authToken: string;

  const checksumKey = 'mock_checksum_key_1234567890';

  // In-memory data store for E2E testing
  let dealsStore: any[] = [];
  let ordersStore: any[] = [];

  const generateSignature = (data: Record<string, any>, key: string): string =>
    generatePaymentSignature(data, key);

  const mockPrismaService = createPaymentsWebhookPrismaMock(
    () => dealsStore,
    () => ordersStore,
  );

  beforeAll(async () => {
    process.env.PAYOS_CHECKSUM_KEY = checksumKey;
    process.env.ORACLE_RELAYER_PRIVATE_KEY =
      process.env.ORACLE_RELAYER_PRIVATE_KEY ||
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    process.env.ESCROW_CONTRACT_ADDRESS =
      process.env.ESCROW_CONTRACT_ADDRESS ||
      '0x165B47291B87569b91696DCE6f1207eE15C9f783';
    process.env.BASE_SEPOLIA_RPC_URL =
      process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    authToken = await jwtService.signAsync({
      sub: '22222222-2222-4222-a222-222222222222',
      email: 'buyer@trustpassz.io',
      role: 'USER',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    dealsStore = [];
    ordersStore = [];
  });

  describe('POST /api/v1/payments/create-link/:dealId', () => {
    it('should generate VietQR checkout link and assign paymentOrderCode to Deal', async () => {
      const dealId = 'd0000000-0000-4000-a000-000000000001';
      dealsStore.push({
        id: dealId,
        title: 'Source Code Escrow Deal',
        amount: new Prisma.Decimal(500000),
        currency: 'VND',
        state: DealState.PENDING,
        paymentOrderCode: null,
      });

      const response = await request(app.getHttpServer())
        .post(`/api/v1/payments/create-link/${dealId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Coc deal escrow',
        })
        .expect(HttpStatus.CREATED);

      expect(response.body).toBeDefined();
      expect(response.body.dealId).toBe(dealId);
      expect(response.body.orderCode).toBeDefined();
      expect(response.body.checkoutUrl).toBeDefined();
      expect(response.body.qrCode).toBeDefined();
      expect(response.body.amount).toBe(500000);
      expect(dealsStore[0].paymentOrderCode).toBe(
        BigInt(response.body.orderCode),
      );
    });
  });

  describe('POST /api/v1/payments/webhook', () => {
    const dealId = 'd0000000-0000-4000-a000-000000000001';
    const orderId = 'o0000000-0000-4000-a000-000000000001';
    const orderCode = 88990011;

    // Kịch bản 1 (Happy Path)
    it('Kịch bản 1 (Happy Path): should verify webhook, transition deal to DEPOSITED, and set order to PAID_ESCROW', async () => {
      dealsStore.push({
        id: dealId,
        title: 'Fullstack Escrow Code',
        amount: new Prisma.Decimal(500000),
        currency: 'VND',
        state: DealState.PENDING,
        paymentOrderCode: BigInt(orderCode),
        inspectionDuration: 86400,
        depositedAt: null,
        webhookIdempotencyKey: null,
      });

      ordersStore.push({
        id: orderId,
        dealId,
        status: OrderStatus.PENDING_PAYMENT,
        totalAmount: new Prisma.Decimal(500000),
        paymentMetadata: {},
      });

      const webhookData = {
        orderCode,
        amount: 500000,
        description: 'Deal Escrow Payment',
        accountNumber: '998877',
        reference: 'FT240926001234',
        transactionDateTime: '2026-09-26 14:30:00',
        currency: 'VND',
        paymentLinkId: 'pl_88990011',
        code: '00',
        desc: 'Success',
      };

      const signature = generateSignature(webhookData, checksumKey);

      const response = await request(app.getHttpServer())
        .post('/api/v1/payments/webhook')
        .send({
          code: '00',
          desc: 'Success',
          success: true,
          data: webhookData,
          signature,
        })
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.deal.state).toBe(DealState.DEPOSITED);
      expect(response.body.deal.depositedAt).toBeDefined();
      expect(response.body.deal.inspectionDeadline).toBeDefined();
      expect(dealsStore[0].state).toBe(DealState.DEPOSITED);
      expect(dealsStore[0].webhookIdempotencyKey).toBe(
        webhookData.reference,
      );
      expect(ordersStore[0].status).toBe(OrderStatus.PAID_ESCROW);
    });

    // Kịch bản 2 (Chống Replay Attack / Idempotency)
    it('Kịch bản 2 (Chống Replay Attack): should return 200 OK on duplicate webhook without altering state', async () => {
      dealsStore.push({
        id: dealId,
        title: 'Fullstack Escrow Code',
        amount: new Prisma.Decimal(500000),
        currency: 'VND',
        state: DealState.DEPOSITED,
        paymentOrderCode: BigInt(orderCode),
        depositedAt: new Date('2026-09-26T07:30:00.000Z'),
        webhookIdempotencyKey: 'FT240926001234',
      });

      const webhookData = {
        orderCode,
        amount: 500000,
        description: 'Deal Escrow Payment',
        accountNumber: '998877',
        reference: 'FT240926001234',
        transactionDateTime: '2026-09-26 14:30:00',
        currency: 'VND',
        paymentLinkId: 'pl_88990011',
        code: '00',
        desc: 'Success',
      };

      const signature = generateSignature(webhookData, checksumKey);

      const response = await request(app.getHttpServer())
        .post('/api/v1/payments/webhook')
        .send({
          code: '00',
          desc: 'Success',
          success: true,
          data: webhookData,
          signature,
        })
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('idempotent');
      expect(response.body.dealId).toBe(dealId);
      expect(response.body.state).toBe(DealState.DEPOSITED);
    });

    // Kịch bản 3 (Chữ ký giả mạo / Invalid Signature)
    it('Kịch bản 3 (Chữ ký giả mạo): should reject webhook with HTTP 400 Bad Request when signature is corrupted', async () => {
      dealsStore.push({
        id: dealId,
        title: 'Fullstack Escrow Code',
        amount: new Prisma.Decimal(500000),
        currency: 'VND',
        state: DealState.PENDING,
        paymentOrderCode: BigInt(orderCode),
      });

      const webhookData = {
        orderCode,
        amount: 500000,
        description: 'Tampered payment payload',
        accountNumber: '998877',
        reference: 'FT_ATTACK_9999',
        transactionDateTime: '2026-09-26 14:30:00',
        currency: 'VND',
        paymentLinkId: 'pl_88990011',
        code: '00',
        desc: 'Success',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/payments/webhook')
        .send({
          code: '00',
          desc: 'Success',
          success: true,
          data: webhookData,
          signature: 'bad_signature_hash_000000000000000000000000000000',
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toMatch(
        /HMAC-SHA256 signature verification failed/i,
      );
      expect(dealsStore[0].state).toBe(DealState.PENDING);
    });

    // Kịch bản 4 (Sai lệch số tiền / Underpaid Amount)
    it('Kịch bản 4 (Sai lệch số tiền): should reject deposit when amount paid is less than required deal amount', async () => {
      dealsStore.push({
        id: dealId,
        title: 'Fullstack Escrow Code',
        amount: new Prisma.Decimal(500000), // Expected 500,000 VND
        currency: 'VND',
        state: DealState.PENDING,
        paymentOrderCode: BigInt(orderCode),
      });

      const webhookData = {
        orderCode,
        amount: 300000, // Underpaid: transferred only 300,000 VND
        description: 'Deal Escrow Payment',
        accountNumber: '998877',
        reference: 'FT_UNDERPAID_111',
        transactionDateTime: '2026-09-26 14:30:00',
        currency: 'VND',
        paymentLinkId: 'pl_88990011',
        code: '00',
        desc: 'Success',
      };

      const signature = generateSignature(webhookData, checksumKey);

      const response = await request(app.getHttpServer())
        .post('/api/v1/payments/webhook')
        .send({
          code: '00',
          desc: 'Success',
          success: true,
          data: webhookData,
          signature,
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toMatch(/Payment amount mismatch/i);
      expect(dealsStore[0].state).toBe(DealState.PENDING);
    });

    // Kịch bản 5 (Deal không ở trạng thái PENDING)
    it('Kịch bản 5 (Deal không ở trạng thái PENDING): should reject deposit when deal is already SETTLED', async () => {
      dealsStore.push({
        id: dealId,
        title: 'Fullstack Escrow Code',
        amount: new Prisma.Decimal(500000),
        currency: 'VND',
        state: DealState.SETTLED, // Terminal state
        paymentOrderCode: BigInt(orderCode),
      });

      const webhookData = {
        orderCode,
        amount: 500000,
        description: 'Deal Escrow Payment',
        accountNumber: '998877',
        reference: 'FT_LATE_PAYMENT_222',
        transactionDateTime: '2026-09-26 14:30:00',
        currency: 'VND',
        paymentLinkId: 'pl_88990011',
        code: '00',
        desc: 'Success',
      };

      const signature = generateSignature(webhookData, checksumKey);

      const response = await request(app.getHttpServer())
        .post('/api/v1/payments/webhook')
        .send({
          code: '00',
          desc: 'Success',
          success: true,
          data: webhookData,
          signature,
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toMatch(
        /Invalid deal state transition.*SETTLED.*expected.*PENDING/i,
      );
      expect(dealsStore[0].state).toBe(DealState.SETTLED);
    });
  });
});
