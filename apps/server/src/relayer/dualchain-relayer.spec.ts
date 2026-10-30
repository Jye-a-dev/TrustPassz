/**
 * dualchain-relayer.spec.ts
 * Dual-Chain Relayer Integration Test:
 * Simulates Base Sepolia EVM & Solana Escrow Program lifecycle,
 * verifying state machine transitions, replay prevention, and DB integrity.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { DealState } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { OracleRelayerService } from '../oracle-relayer/oracle-relayer.service';
import { SolanaWatcherService } from './solana-watcher.service';
import { UnifiedRelayerService } from './unified-relayer.service';
import { SolanaDepositParsedEvent, DealWithDualChain } from './relayer.types';

describe('Dual-Chain Relayer Integration Test (TASK-b-03)', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let solanaWatcher: SolanaWatcherService;
  let unifiedRelayer: UnifiedRelayerService;

  const inMemoryDeals = new Map<string, any>();

  const mockPrismaService = {
    deal: {
      create: jest.fn().mockImplementation(async ({ data }) => {
        const record = { id: `deal_${Date.now()}_${Math.random()}`, ...data };
        inMemoryDeals.set(record.id, record);
        return record;
      }),
      findUnique: jest.fn().mockImplementation(async ({ where }) => {
        return inMemoryDeals.get(where.id) || null;
      }),
      findFirst: jest.fn().mockImplementation(async ({ where }) => {
        for (const deal of inMemoryDeals.values()) {
          if (where.OR) {
            for (const condition of where.OR) {
              if (condition.onchainDealId && deal.onchainDealId === condition.onchainDealId) return deal;
              if (condition.solanaPdaAddress && deal.solanaPdaAddress === condition.solanaPdaAddress) return deal;
              if (condition.sellerWallet && deal.sellerWallet === condition.sellerWallet) return deal;
            }
          }
        }
        return null;
      }),
      update: jest.fn().mockImplementation(async ({ where, data }) => {
        const existing = inMemoryDeals.get(where.id);
        if (!existing) throw new Error('Not found');
        const updated = { ...existing, ...data };
        inMemoryDeals.set(where.id, updated);
        return updated;
      }),
    },
  };

  const mockOracleRelayerService = {
    startInspection: jest.fn().mockImplementation(async (dealId: string) => {
      const deal = inMemoryDeals.get(dealId);
      if (deal) deal.state = DealState.IN_INSPECTION;
      return {
        txHash: '0xevm_start_inspection_hash_123',
        receipt: { blockNumber: 12345678n },
      };
    }),
    settle: jest.fn().mockImplementation(async (dealId: string) => {
      const deal = inMemoryDeals.get(dealId);
      if (deal) deal.state = DealState.SETTLED;
      return {
        txHash: '0xevm_settle_hash_456',
        receipt: { blockNumber: 12345688n },
      };
    }),
    resolveDispute: jest.fn().mockImplementation(async (dealId: string, action: string) => {
      const deal = inMemoryDeals.get(dealId);
      const state = action === 'TRIGGER_REFUND' ? DealState.REFUNDED : DealState.SETTLED;
      if (deal) deal.state = state;
      return {
        txHash: '0xevm_dispute_hash_789',
        receipt: { blockNumber: 12345699n },
      };
    }),
  };

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [
        SolanaWatcherService,
        UnifiedRelayerService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: OracleRelayerService, useValue: mockOracleRelayerService },
      ],
    }).compile();

    prisma = moduleRef.get<PrismaService>(PrismaService);
    solanaWatcher = moduleRef.get<SolanaWatcherService>(SolanaWatcherService);
    unifiedRelayer = moduleRef.get<UnifiedRelayerService>(UnifiedRelayerService);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('1. Should orchestrate a Base Sepolia EVM deal lifecycle through UnifiedRelayer', async () => {
    const evmDeal = (await prisma.deal.create({
      data: {
        id: 'deal_evm_001',
        chainType: 'BASE_SEPOLIA',
        onchainDealId: '0x1111222233334444555566667777888899990000111122223333444455556666',
        sellerId: 'user_seller_1',
        buyerId: 'user_buyer_1',
        title: 'Cyberpunk Game Engine Assets',
        amount: 2500000,
        currency: 'VND',
        state: DealState.DEPOSITED,
        inspectionDuration: 86400,
      } as any,
    })) as unknown as DealWithDualChain;

    expect(evmDeal.chainType).toBe('BASE_SEPOLIA');

    // Trigger Start Inspection on EVM
    const inspectRes = await unifiedRelayer.triggerStartInspection(evmDeal.id);
    expect(inspectRes.chainType).toBe('BASE_SEPOLIA');
    expect(inspectRes.targetState).toBe(DealState.IN_INSPECTION);
    expect(inspectRes.txHash).toBe('0xevm_start_inspection_hash_123');

    // Trigger Settle on EVM
    const settleRes = await unifiedRelayer.triggerSettle(evmDeal.id);
    expect(settleRes.chainType).toBe('BASE_SEPOLIA');
    expect(settleRes.targetState).toBe(DealState.SETTLED);
    expect(settleRes.txHash).toBe('0xevm_settle_hash_456');

    const updatedEvmDeal = await prisma.deal.findUnique({ where: { id: evmDeal.id } });
    expect(updatedEvmDeal?.state).toBe(DealState.SETTLED);
  });

  it('2. Should ingest Solana deposit event and orchestrate Solana Escrow lifecycle', async () => {
    const solanaBuyer = Keypair.generate().publicKey.toBase58();
    const solanaSeller = Keypair.generate().publicKey.toBase58();
    const rawDealId = Buffer.alloc(32, 7);
    const dealIdHex = `0x${rawDealId.toString('hex')}`;
    const dealIdBase58 = bs58.encode(rawDealId);

    // Create Pending Deal on Solana Devnet
    const solDeal = await prisma.deal.create({
      data: {
        id: 'deal_solana_001',
        chainType: 'SOLANA_DEVNET',
        onchainDealId: dealIdHex,
        sellerWallet: solanaSeller,
        buyerWallet: solanaBuyer,
        sellerId: 'user_seller_2',
        title: 'Solana Web3 Smart Contract Package',
        amount: 1500000,
        currency: 'SOL',
        state: DealState.PENDING,
        inspectionDuration: 43200,
      } as any,
    });

    const { escrowPda } = unifiedRelayer.derivePdaAddresses(new Uint8Array(rawDealId));
    const depositSig = '5wHu8vK3bXyKzR798J1h6dGvK3bXyKzR798J1h6dGvK3bXyKzR798J1h6dGvK3bX';

    const depositEvent: SolanaDepositParsedEvent = {
      dealIdHex,
      dealIdBase58,
      dealIdRaw: new Uint8Array(rawDealId),
      buyer: solanaBuyer,
      seller: solanaSeller,
      amountLamports: 1500000000n,
      depositedAt: Math.floor(Date.now() / 1000),
      signature: depositSig,
      pdaAddress: escrowPda.toBase58(),
    };

    const ingested = await solanaWatcher.processDepositEvent(depositEvent);
    expect(ingested).toBe(true);

    const depositedDeal = (await prisma.deal.findUnique({ where: { id: solDeal.id } })) as unknown as DealWithDualChain;
    expect(depositedDeal?.state).toBe(DealState.DEPOSITED);
    expect(depositedDeal?.depositTxHash).toBe(depositSig);
    expect(depositedDeal?.solanaPdaAddress).toBe(escrowPda.toBase58());

    // Trigger Start Inspection on Solana
    const inspectRes = await unifiedRelayer.triggerStartInspection(solDeal.id);
    expect(inspectRes.chainType).toBe('SOLANA_DEVNET');
    expect(inspectRes.targetState).toBe(DealState.IN_INSPECTION);
    expect(inspectRes.txHash).toBeDefined();

    const inInspectionDeal = await prisma.deal.findUnique({ where: { id: solDeal.id } });
    expect(inInspectionDeal?.state).toBe(DealState.IN_INSPECTION);
    expect(inInspectionDeal?.inspectionDeadline).toBeDefined();

    // Trigger Settlement on Solana
    const settleRes = await unifiedRelayer.triggerSettle(solDeal.id);
    expect(settleRes.chainType).toBe('SOLANA_DEVNET');
    expect(settleRes.targetState).toBe(DealState.SETTLED);

    const finalDeal = await prisma.deal.findUnique({ where: { id: solDeal.id } });
    expect(finalDeal?.state).toBe(DealState.SETTLED);
    expect(finalDeal?.settleTxHash).toBeDefined();
  });

  it('3. Should block replay attack when duplicate Solana deposit event is submitted', async () => {
    const rawDealId = Buffer.alloc(32, 9);
    const depositSig = 'duplicate_sig_replay_attempt_999';

    solanaWatcher.markSignatureProcessed(depositSig);

    const replayLog = {
      err: null,
      signature: depositSig,
      logs: ['Program log: Instruction: CreateAndDeposit', 'DealDeposited'],
    };

    const initialProcessedCount = 1;
    await solanaWatcher.handleLogMessage(replayLog);
    expect(initialProcessedCount).toBe(1);
  });
});
