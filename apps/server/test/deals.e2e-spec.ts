/// <reference types="jest" />
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AssetType, DealState, Prisma } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import '../src/common/utils/bigint-serializer.util';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import {
  buyerUser,
  createMockPrismaService,
  MockDeal,
  MockDigitalAsset,
  sellerUser,
} from './mocks/prisma.mock';

describe('DealsController (e2e)', () => {
  let app: INestApplication<App>;
  let dealsStore: MockDeal[] = [];
  let digitalAssetsStore: MockDigitalAsset[] = [];

  const mockPrismaService = createMockPrismaService(
    () => dealsStore,
    (deals) => {
      dealsStore = deals;
    },
    () => digitalAssetsStore,
    (assets) => {
      digitalAssetsStore = assets;
    },
  );

  beforeAll(async () => {
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
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    dealsStore = [];
    digitalAssetsStore = [];
  });

  describe('POST /api/v1/deals', () => {
    it('should create a new deal with encrypted digital asset and return 201 Created', async () => {
      const payload = {
        sellerId: sellerUser.id,
        buyerId: buyerUser.id,
        title: 'Fullstack Escrow Marketplace Source Code',
        description: 'Production-grade escrow platform built on Base Sepolia',
        amount: 2500000,
        currency: 'VND',
        inspectionDuration: 86400,
        digitalAsset: {
          assetType: AssetType.SOURCE_CODE,
          encryptedContent: 'cipher_secret_payload_base64_encoded==',
          encryptionIv: 'e4d29e7c3b9f4a120000000000000000',
          authTag: '9f8e7d6c5b4a32100000000000000000',
          contentHash:
            'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
          fileName: 'trustpassz-v1.zip',
          fileSizeBytes: 52428800,
          maxAccessLimit: 3,
        },
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/deals')
        .send(payload)
        .expect(HttpStatus.CREATED);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBeDefined();
      expect(response.body.title).toBe(payload.title);
      expect(response.body.state).toBe(DealState.PENDING);
      expect(response.body.digitalAsset).toBeDefined();
      expect(response.body.digitalAsset.encryptedContent).toBe(
        payload.digitalAsset.encryptedContent,
      );
      expect(response.body.digitalAsset.encryptionIv).toBe(
        payload.digitalAsset.encryptionIv,
      );
      expect(response.body.digitalAsset.authTag).toBe(
        payload.digitalAsset.authTag,
      );
    });

    it('should be idempotent and prevent duplicate records when multi-clicked with Idempotency-Key', async () => {
      const idempotencyKey = 'test-idempotency-key-task-a-3';
      const payload = {
        sellerId: sellerUser.id,
        buyerId: buyerUser.id,
        title: 'Idempotency Safe Deal',
        amount: 1500000,
        currency: 'VND',
        digitalAsset: {
          assetType: AssetType.LICENSE_KEY,
          encryptedContent: 'license_key_encrypted_payload==',
          encryptionIv: 'e4d29e7c3b9f4a120000000000000000',
          authTag: '9f8e7d6c5b4a32100000000000000000',
          contentHash: 'hash1234567890abcdef',
        },
      };

      const [res1, res2] = await Promise.all([
        request(app.getHttpServer())
          .post('/api/v1/deals')
          .set('Idempotency-Key', idempotencyKey)
          .send(payload),
        request(app.getHttpServer())
          .post('/api/v1/deals')
          .set('Idempotency-Key', idempotencyKey)
          .send(payload),
      ]);

      expect(res1.status).toBe(HttpStatus.CREATED);
      expect(res2.status).toBe(HttpStatus.CREATED);
      expect(res1.body.id).toBe(res2.body.id);
      expect(dealsStore.length).toBe(1);
    });
  });

  describe('GET /api/v1/deals/count', () => {
    it('should return total count and breakdown by deal state', async () => {
      dealsStore.push(
        {
          id: 'd0000000-0000-4000-a000-000000000001',
          sellerId: sellerUser.id,
          buyerId: buyerUser.id,
          title: 'Deal 1',
          amount: new Prisma.Decimal(100),
          currency: 'VND',
          state: DealState.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'd0000000-0000-4000-a000-000000000002',
          sellerId: sellerUser.id,
          buyerId: buyerUser.id,
          title: 'Deal 2',
          amount: new Prisma.Decimal(200),
          currency: 'VND',
          state: DealState.DEPOSITED,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'd0000000-0000-4000-a000-000000000003',
          sellerId: sellerUser.id,
          buyerId: buyerUser.id,
          title: 'Deal 3',
          amount: new Prisma.Decimal(300),
          currency: 'VND',
          state: DealState.SETTLED,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      );

      const response = await request(app.getHttpServer())
        .get('/api/v1/deals/count')
        .expect(HttpStatus.OK);

      expect(response.body).toBeDefined();
      expect(response.body.total).toBe(3);
      expect(response.body.breakdown).toBeDefined();
      expect(response.body.breakdown[DealState.PENDING]).toBe(1);
      expect(response.body.breakdown[DealState.DEPOSITED]).toBe(1);
      expect(response.body.breakdown[DealState.SETTLED]).toBe(1);
      expect(response.body.breakdown[DealState.IN_INSPECTION]).toBe(0);
      expect(response.body.breakdown[DealState.REFUNDED]).toBe(0);
      expect(response.body.breakdown[DealState.DISPUTED]).toBe(0);
    });
  });

  describe('GET /api/v1/deals', () => {
    it('should return paginated list of deals with metadata', async () => {
      for (let i = 1; i <= 3; i++) {
        dealsStore.push({
          id: `d0000000-0000-4000-a000-00000000000${i}`,
          sellerId: sellerUser.id,
          buyerId: buyerUser.id,
          title: `Deal Title ${i}`,
          description: `Description ${i}`,
          amount: new Prisma.Decimal(100 * i),
          currency: 'VND',
          state: DealState.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      const response = await request(app.getHttpServer())
        .get('/api/v1/deals?page=1&limit=2')
        .expect(HttpStatus.OK);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.total).toBe(3);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(2);
      expect(response.body.meta.totalPages).toBe(2);
    });
  });

  describe('PATCH /api/v1/deals/:id', () => {
    it('should partially update an active deal successfully', async () => {
      const dealId = 'd0000000-0000-4000-a000-000000000010';
      dealsStore.push({
        id: dealId,
        sellerId: sellerUser.id,
        buyerId: buyerUser.id,
        title: 'Original Title',
        amount: new Prisma.Decimal(1000),
        currency: 'VND',
        state: DealState.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updatePayload = {
        title: 'Updated Deal Title',
        state: DealState.DEPOSITED,
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/deals/${dealId}`)
        .send(updatePayload)
        .expect(HttpStatus.OK);

      expect(response.body.title).toBe('Updated Deal Title');
      expect(response.body.state).toBe(DealState.DEPOSITED);
    });

    it('should throw 400 Bad Request when attempting to modify a deal in SETTLED terminal state', async () => {
      const settledDealId = 'd0000000-0000-4000-a000-000000000020';
      dealsStore.push({
        id: settledDealId,
        sellerId: sellerUser.id,
        buyerId: buyerUser.id,
        title: 'Finalized Deal',
        amount: new Prisma.Decimal(5000),
        currency: 'VND',
        state: DealState.SETTLED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/deals/${settledDealId}`)
        .send({ title: 'Illegal Modification Attempt' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toMatch(/terminal state/i);
    });
  });

  describe('DELETE /api/v1/deals/:id', () => {
    it('should delete a deal successfully if it is in PENDING state', async () => {
      const pendingDealId = 'd0000000-0000-4000-a000-000000000030';
      dealsStore.push({
        id: pendingDealId,
        sellerId: sellerUser.id,
        buyerId: buyerUser.id,
        title: 'Pending Deal to Delete',
        amount: new Prisma.Decimal(1000),
        currency: 'VND',
        state: DealState.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app.getHttpServer())
        .delete(`/api/v1/deals/${pendingDealId}`)
        .expect(HttpStatus.OK);

      expect(response.body.success).toBe(true);
      expect(dealsStore.find((d) => d.id === pendingDealId)).toBeUndefined();
    });

    it('should throw 400 Bad Request when attempting to delete a DEPOSITED deal', async () => {
      const depositedDealId = 'd0000000-0000-4000-a000-000000000040';
      dealsStore.push({
        id: depositedDealId,
        sellerId: sellerUser.id,
        buyerId: buyerUser.id,
        title: 'Funded Escrow Deal',
        amount: new Prisma.Decimal(5000),
        currency: 'VND',
        state: DealState.DEPOSITED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app.getHttpServer())
        .delete(`/api/v1/deals/${depositedDealId}`)
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toMatch(
        /only deals in PENDING state can be deleted/i,
      );
      expect(dealsStore.find((d) => d.id === depositedDealId)).toBeDefined();
    });
  });
});
