/// <reference types="jest" />
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DealState, OrderStatus, Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import '../src/common/utils/bigint-serializer.util';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { JwtService } from '../src/modules/auth/jwt.service';

describe('Payments & Webhooks (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let authToken: string;

  const checksumKey = 'mock_checksum_key_1234567890';

  // In-memory data store for E2E testing
  let dealsStore: any[] = [];
  let ordersStore: any[] = [];

  const generateSignature = (
    data: Record<string, any>,
    key: string,
  ): string => {
    const sortedKeys = Object.keys(data).sort();
    const queryParts: string[] = [];
    for (const k of sortedKeys) {
      const val = data[k];
      if (val !== undefined && val !== null) {
        queryParts.push(`${k}=${val}`);
      }
    }
    return crypto
      .createHmac('sha256', key)
      .update(queryParts.join('&'))
      .digest('hex');
  };

  const mockPrismaService = {
    deal: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const found = dealsStore.find((d) => d.id === where.id);
        if (!found) return Promise.resolve(null);
        const order = ordersStore.find((o) => o.dealId === found.id) || null;
        return Promise.resolve({ ...found, order });
      }),
      findFirst: jest.fn().mockImplementation(({ where }) => {
        if (where.webhookIdempotencyKey !== undefined) {
          const match = dealsStore.find(
            (d) => d.webhookIdempotencyKey === where.webhookIdempotencyKey,
          );
          return Promise.resolve(match || null);
        }
        if (where.OR) {
          for (const condition of where.OR) {
            if (condition.webhookIdempotencyKey) {
              const match = dealsStore.find(
                (d) =>
                  d.webhookIdempotencyKey ===
                  condition.webhookIdempotencyKey,
              );
              if (match) return Promise.resolve(match);
            }
            if (condition.paymentOrderCode) {
              const match = dealsStore.find(
                (d) =>
                  d.paymentOrderCode === condition.paymentOrderCode &&
                  condition.state?.in?.includes(d.state),
              );
              if (match) return Promise.resolve(match);
            }
          }
          return Promise.resolve(null);
        }
        if (where.paymentOrderCode !== undefined) {
          const match = dealsStore.find(
            (d) => d.paymentOrderCode === where.paymentOrderCode,
          );
          if (!match) return Promise.resolve(null);
          const order =
            ordersStore.find((o) => o.dealId === match.id) || null;
          return Promise.resolve({ ...match, order });
        }
        return Promise.resolve(null);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const index = dealsStore.findIndex((d) => d.id === where.id);
        if (index === -1) return Promise.resolve(null);
        dealsStore[index] = { ...dealsStore[index], ...data };
        return Promise.resolve(dealsStore[index]);
      }),
    },
    order: {
      update: jest.fn().mockImplementation(({ where, data }) => {
        const index = ordersStore.findIndex((o) => o.id === where.id);
        if (index === -1) return Promise.resolve(null);
        ordersStore[index] = { ...ordersStore[index], ...data };
        return Promise.resolve(ordersStore[index]);
      }),
    },
    $transaction: jest
      .fn()
      .mockImplementation((cb) => cb(mockPrismaService)),
  };

  beforeAll(async () => {
    process.env.PAYOS_CHECKSUM_KEY = checksumKey;

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
