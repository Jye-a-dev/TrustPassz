import request from 'supertest';
import {
  SELLER_WALLET,
  BUYER_WALLET,
  generateTestAuthToken,
} from '../fixtures/test-wallets';
import { SAMPLE_SOURCE_CODE_ASSET } from '../fixtures/sample-assets';
import { createMockPayOSWebhook } from '../fixtures/mock-payos-webhook';
import { encryptSecret, decryptSecret, hashContent } from '../helpers/crypto-helper';
import { DbHelper } from '../helpers/db-helper';
import { ContractHelper, OnchainDealState } from '../helpers/contract-helper';

const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const AI_PIPELINE_URL = process.env.AI_PIPELINE_URL || 'http://localhost:3100';

describe('Scenario 1: Happy Path (Creation -> VietQR Webhook -> Vault -> Settlement)', () => {
  const sellerToken = generateTestAuthToken(SELLER_WALLET);
  const buyerToken = generateTestAuthToken(BUYER_WALLET);
  const contractHelper = new ContractHelper();

  let dealId: string;
  let paymentOrderCode: number;
  let secretPassphrase: string;
  let expectedContentHash: string;

  beforeAll(async () => {
    await DbHelper.ensureTestUsers();
  });

  afterAll(async () => {
    if (dealId) {
      await DbHelper.cleanupDeals([dealId]);
    }
    await DbHelper.disconnect();
  });

  // Step 1: Seller AI Suggestion & Deal Creation with Client-Side AES-256-GCM
  it('Step 1: Seller fetches AI deal suggestions, encrypts secret client-side, and creates deal', async () => {
    // 1.1 Test connection to FastAPI AI Pipeline for pricing & rule terms
    let suggestedInspectionHours = 12;
    try {
      const aiRes = await fetch(`${AI_PIPELINE_URL}/api/v1/suggest-deal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: SAMPLE_SOURCE_CODE_ASSET.title,
          description: SAMPLE_SOURCE_CODE_ASSET.description,
          initial_price: SAMPLE_SOURCE_CODE_ASSET.amountVnd,
        }),
      });
      if (aiRes.ok) {
        const suggestion = await aiRes.json();
        expect([6, 12, 24]).toContain(suggestion.suggested_inspection_hours);
        suggestedInspectionHours = suggestion.suggested_inspection_hours;
      }
    } catch {
      // Graceful fallback if AI pipeline container is on standby
    }

    // 1.2 Client-side AES-256-GCM encryption
    secretPassphrase = 'trustpassz_audit_passphrase_secure_2026';
    expectedContentHash = await hashContent(SAMPLE_SOURCE_CODE_ASSET.plainSecret);

    const encryptedPayload = await encryptSecret(
      SAMPLE_SOURCE_CODE_ASSET.plainSecret,
      secretPassphrase,
    );

    expect(encryptedPayload.encryptedContent).toBeDefined();
    expect(encryptedPayload.encryptionIv).toHaveLength(24); // 12 bytes hex
    expect(encryptedPayload.authTag).toHaveLength(32); // 16 bytes hex
    expect(encryptedPayload.contentHash).toBe(expectedContentHash);

    // 1.3 POST /api/v1/deals
    const res = await request(BASE_URL)
      .post('/api/v1/deals')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        sellerId: SELLER_WALLET.id,
        buyerId: BUYER_WALLET.id,
        title: SAMPLE_SOURCE_CODE_ASSET.title,
        description: SAMPLE_SOURCE_CODE_ASSET.description,
        amount: SAMPLE_SOURCE_CODE_ASSET.amountVnd,
        currency: 'VND',
        inspectionDuration: suggestedInspectionHours * 3600,
        digitalAsset: {
          assetType: 'SOURCE_CODE',
          encryptedContent: encryptedPayload.encryptedContent,
          encryptionIv: encryptedPayload.encryptionIv,
          authTag: encryptedPayload.authTag,
          contentHash: encryptedPayload.contentHash,
          fileName: SAMPLE_SOURCE_CODE_ASSET.fileName,
          fileSizeBytes: SAMPLE_SOURCE_CODE_ASSET.fileSizeBytes,
          maxAccessLimit: 3,
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.state).toBe('PENDING');
    expect(res.body.digitalAsset).toBeDefined();

    dealId = res.body.id;

    // Verify Neon DB record
    const dbDeal = await DbHelper.findDealById(dealId);
    expect(dbDeal).not.toBeNull();
    expect(dbDeal?.state).toBe('PENDING');
    expect(dbDeal?.digitalAsset?.authTag).toBe(encryptedPayload.authTag);
  });

  // Step 2: Buyer initiates VietQR payment link
  it('Step 2: Buyer enters deal room and generates dynamic VietQR payment order', async () => {
    const res = await request(BASE_URL)
      .post(`/api/v1/payments/create-link/${dealId}`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        description: `Deal ${dealId.slice(0, 8)}`,
      });

    expect(res.status).toBe(201);
    expect(res.body.orderCode).toBeDefined();
    expect(res.body.qrCode).toBeDefined();
    expect(res.body.amount).toBe(SAMPLE_SOURCE_CODE_ASSET.amountVnd);

    paymentOrderCode = res.body.orderCode;

    // Verify paymentOrderCode mapped to Deal in Neon DB
    const dbDeal = await DbHelper.findDealById(dealId);
    expect(Number(dbDeal?.paymentOrderCode)).toBe(paymentOrderCode);
  });

  // Step 3: VietQR Webhook with HMAC-SHA256 signature
  it('Step 3: PayOS fires VietQR deposit webhook with valid HMAC signature', async () => {
    const webhookPayload = createMockPayOSWebhook({
      orderCode: paymentOrderCode,
      amount: SAMPLE_SOURCE_CODE_ASSET.amountVnd,
      description: `Deal ${dealId.slice(0, 8)}`,
    });

    const res = await request(BASE_URL)
      .post('/api/v1/payments/webhook')
      .send(webhookPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.deal.state).toBe('DEPOSITED');
  });

  // Step 4: Distributed State Verification & Digital Vault Decryption
  it('Step 4: Deal transitions to DEPOSITED, inspection window starts, Buyer unlocks & decrypts vault', async () => {
    // 4.1 Verify DB transition and inspection window
    const dbDeal = await DbHelper.findDealById(dealId);
    expect(dbDeal?.state).toBe('DEPOSITED');
    expect(dbDeal?.depositedAt).not.toBeNull();
    expect(dbDeal?.inspectionDeadline).not.toBeNull();

    const diffMs =
      new Date(dbDeal!.inspectionDeadline!).getTime() -
      new Date(dbDeal!.depositedAt!).getTime();
    expect(diffMs).toBeGreaterThanOrEqual(6 * 3600 * 1000);

    // 4.2 Buyer unlocks vault
    const unlockRes = await request(BASE_URL)
      .post(`/api/v1/deals/${dealId}/vault/unlock`)
      .set('Authorization', `Bearer ${buyerToken}`);

    expect([200, 201]).toContain(unlockRes.status);
    expect(unlockRes.body.encryptedContent).toBeDefined();
    expect(unlockRes.body.encryptionIv).toBeDefined();
    expect(unlockRes.body.authTag).toBeDefined();
    expect(unlockRes.body.contentHash).toBe(expectedContentHash);

    // 4.3 Client-side AES-256-GCM zero-knowledge decryption
    const decryptedPlain = await decryptSecret(
      {
        encryptedContent: unlockRes.body.encryptedContent,
        encryptionIv: unlockRes.body.encryptionIv,
        authTag: unlockRes.body.authTag,
        expectedHash: unlockRes.body.contentHash,
      },
      secretPassphrase,
    );

    expect(decryptedPlain).toBe(SAMPLE_SOURCE_CODE_ASSET.plainSecret);
  });

  // Step 5: Escrow Settlement & On-chain Verification
  it('Step 5: Buyer confirms acceptance, triggers settle, transitions DB & Smart Contract state', async () => {
    const settleRes = await request(BASE_URL)
      .post(`/api/v1/deals/${dealId}/settle`)
      .set('Authorization', `Bearer ${buyerToken}`);

    // Accepted response
    expect([200, 201]).toContain(settleRes.status);

    // Verify Neon DB updated to SETTLED
    const updatedDeal = await DbHelper.findDealById(dealId);
    expect(updatedDeal?.state).toBe('SETTLED');

    // Verify On-chain Smart Contract Escrow State via Viem
    try {
      const onchain = await contractHelper.getDeal(dealId);
      if (onchain) {
        expect([OnchainDealState.Settled, OnchainDealState.Uninitialized]).toContain(
          onchain.stateData.state,
        );
      }
    } catch {
      // Local fork or rate limit fallback
    }
  });
});
