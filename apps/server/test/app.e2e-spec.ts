import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    process.env.ORACLE_RELAYER_PRIVATE_KEY =
      process.env.ORACLE_RELAYER_PRIVATE_KEY ||
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    process.env.ESCROW_CONTRACT_ADDRESS =
      process.env.ESCROW_CONTRACT_ADDRESS ||
      '0x88a82fe4f3be44bb493fa6e7efd68313e7c2ec15';
    process.env.BASE_SEPOLIA_RPC_URL =
      process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  afterEach(async () => {
    await app.close();
  });
});
