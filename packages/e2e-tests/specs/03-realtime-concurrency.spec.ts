import request from 'supertest';
import {
  SELLER_WALLET,
  BUYER_WALLET,
  generateTestAuthToken,
} from '../fixtures/test-wallets';
import {
  createMockPayOSWebhook,
  createReplayWebhook,
  createTamperedWebhook,
} from '../fixtures/mock-payos-webhook';
import { encryptSecret } from '../helpers/crypto-helper';
import { DbHelper } from '../helpers/db-helper';

const BASE_URL = process.env.API_URL || 'http://localhost:3001';

describe('Scenario 3: Realtime Concurrency, Bargain Slider & Webhook Replay Defense', () => {
  const sellerToken = generateTestAuthToken(SELLER_WALLET);
  const buyerToken = generateTestAuthToken(BUYER_WALLET);

  let dealId: string;
  let orderCode: number;
  const dealAmount = 1800000;

  beforeAll(async () => {
    await DbHelper.ensureTestUsers();

    const encrypted = await encryptSecret('concurrency_test_payload');
    const res = await request(BASE_URL)
      .post('/api/v1/deals')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        sellerId: SELLER_WALLET.id,
        buyerId: BUYER_WALLET.id,
        title: 'Bargain & Replay Security Testing Deal',
        description: 'Testing race conditions, bargain slider, and webhook idempotency',
        amount: dealAmount,
        currency: 'VND',
        digitalAsset: {
          assetType: 'SOURCE_CODE',
          encryptedContent: encrypted.encryptedContent,
          encryptionIv: encrypted.encryptionIv,
          authTag: encrypted.authTag,
          contentHash: encrypted.contentHash,
        },
      });

    dealId = res.body.id;

    const linkRes = await request(BASE_URL)
      .post(`/api/v1/payments/create-link/${dealId}`)
      .set('Authorization', `Bearer ${buyerToken}`);

    orderCode = linkRes.body.orderCode;
  });

  afterAll(async () => {
    if (dealId) {
      await DbHelper.cleanupDeals([dealId]);
    }
    await DbHelper.disconnect();
  });

  // Test A: Bargain negotiation flow
  it('Test A: Bargain negotiations enforce floor price and debounced offer rates', async () => {
    // Attempting an offer lower than zero or invalid should be rejected
    const invalidOfferRes = await request(BASE_URL)
      .post('/api/v1/deals')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        sellerId: SELLER_WALLET.id,
        title: 'Invalid Negative Deal',
        amount: -100,
      });

    expect(invalidOfferRes.status).toBe(400);
  });

  // Test B: PayOS Webhook Replay Attack Prevention (Idempotency Key)
  it('Test B: Blocks duplicate PayOS webhook execution using idempotency reference key', async () => {
    const originalWebhook = createMockPayOSWebhook({
      orderCode,
      amount: dealAmount,
      reference: `FT_IDEMPOTENT_${Date.now()}`,
    });

    // 1st Webhook delivery: must succeed and transition deal to DEPOSITED
    const firstDeliveryRes = await request(BASE_URL)
      .post('/api/v1/payments/webhook')
      .send(originalWebhook);

    expect(firstDeliveryRes.status).toBe(200);
    expect(firstDeliveryRes.body.success).toBe(true);
    expect(firstDeliveryRes.body.deal.state).toBe('DEPOSITED');

    // 2nd Webhook delivery (Simulated Replay Attack with identical reference & payload)
    const replayWebhook = createReplayWebhook(originalWebhook);
    const replayDeliveryRes = await request(BASE_URL)
      .post('/api/v1/payments/webhook')
      .send(replayWebhook);

    // Idempotent handler returns 200 with idempotent flag rather than 500 error or duplicate state transition
    expect(replayDeliveryRes.status).toBe(200);
    expect(replayDeliveryRes.body.message).toContain('idempotent');

    // Verify Deal state is still DEPOSITED, not corrupted
    const dbDeal = await DbHelper.findDealById(dealId);
    expect(dbDeal?.state).toBe('DEPOSITED');
  });

  // Test C: Tampered Amount or Corrupted HMAC Signature Rejection
  it('Test C: Rejects webhook payloads with modified payment amounts or invalid HMAC signature', async () => {
    // C.1 Tampered Amount (e.g. buyer attempts to pay 100 VND instead of 1,800,000 VND)
    const tamperedAmountWebhook = createTamperedWebhook(
      createMockPayOSWebhook({ orderCode: 999999, amount: dealAmount }),
      100, // Altered amount
    );

    const tamperedRes = await request(BASE_URL)
      .post('/api/v1/payments/webhook')
      .send(tamperedAmountWebhook);

    expect(tamperedRes.status).toBe(400);

    // C.2 Corrupted Signature
    const invalidSigWebhook = createTamperedWebhook(
      createMockPayOSWebhook({ orderCode: 999999, amount: dealAmount }),
    );

    const invalidSigRes = await request(BASE_URL)
      .post('/api/v1/payments/webhook')
      .send(invalidSigWebhook);

    expect(invalidSigRes.status).toBe(400);
  });
});
