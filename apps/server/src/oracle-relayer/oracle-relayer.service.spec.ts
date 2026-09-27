/**
 * oracle-relayer.service.spec.ts
 *
 * Test suite for OracleRelayerService.
 * Mocks all Viem client calls so no real RPC/chain interaction occurs.
 *
 * Covers:
 *  1. Happy path — startInspection, settle, resolveDispute (APPROVE_PAYOUT / TRIGGER_REFUND)
 *  2. ESCALATE_TO_ADMIN bypass (no on-chain tx)
 *  3. On-chain revert (simulateContract throws) → returns null, does not throw
 *  4. Receipt status === 'reverted' → returns null, does not throw
 *  5. Nonce sequencing — concurrent calls must result in strictly ascending nonces
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import {
  createPublicClient,
  createWalletClient,
  type Hash,
  type TransactionReceipt,
} from 'viem';
import { OracleRelayerService } from './oracle-relayer.service';
import { PrismaService } from '../database/prisma.service';
import * as OracleConfig from './oracle-relayer.config';
import * as viemAccounts from 'viem/accounts';

// ---------------------------------------------------------------------------
// Jest module mocks
// ---------------------------------------------------------------------------

jest.mock('viem', () => {
  const actual = jest.requireActual<typeof import('viem')>('viem');
  return {
    ...actual,
    createPublicClient: jest.fn(),
    createWalletClient: jest.fn(),
  };
});

jest.mock('viem/accounts', () => ({
  privateKeyToAccount: jest.fn(),
}));

jest.mock('./oracle-relayer.config', () => ({
  loadOracleRelayerConfig: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;
const MOCK_CONTRACT = '0x165B47291B87569b91696DCE6f1207eE15C9f783' as const;
const MOCK_RPC = 'https://sepolia.base.org' as const;
const MOCK_ACCOUNT_ADDRESS =
  '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as const;
const MOCK_TX_HASH =
  '0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc1' as const;

/** Build a minimal TransactionReceipt stub */
function makeReceipt(status: 'success' | 'reverted' = 'success'): TransactionReceipt {
  return {
    status,
    transactionHash: MOCK_TX_HASH,
    blockNumber: 1234567n,
    blockHash: '0x0000' as Hash,
    transactionIndex: 0,
    from: MOCK_ACCOUNT_ADDRESS,
    to: MOCK_CONTRACT,
    contractAddress: null,
    cumulativeGasUsed: 21000n,
    gasUsed: 21000n,
    effectiveGasPrice: 1000000000n,
    logs: [],
    logsBloom: '0x',
    type: 'eip1559',
    root: undefined,
  } as unknown as TransactionReceipt;
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('OracleRelayerService', () => {
  let service: OracleRelayerService;
  let prisma: jest.Mocked<PrismaService>;

  // Mocked Viem client methods
  // Using jest.Mock (untyped) so implementations can accept args and
  // mock.calls[0][0] access type-checks correctly at the call-site.
  let mockSimulateContract: jest.Mock;
  let mockGetTransactionCount: jest.Mock;
  let mockWaitForTransactionReceipt: jest.Mock;
  let mockWriteContract: jest.Mock;

  beforeEach(async () => {
    // --- Env config mock ---
    (OracleConfig.loadOracleRelayerConfig as jest.Mock).mockReturnValue({
      privateKey: MOCK_PRIVATE_KEY,
      contractAddress: MOCK_CONTRACT,
      rpcUrl: MOCK_RPC,
    });

    // --- Account mock ---
    (viemAccounts.privateKeyToAccount as jest.Mock).mockReturnValue({
      address: MOCK_ACCOUNT_ADDRESS,
      signMessage: jest.fn(),
      signTransaction: jest.fn(),
      signTypedData: jest.fn(),
    });

    // --- Public client mock ---
    mockSimulateContract = jest.fn().mockResolvedValue({ result: undefined });
    mockGetTransactionCount = jest.fn().mockResolvedValue(42);
    mockWaitForTransactionReceipt = jest
      .fn()
      .mockResolvedValue(makeReceipt('success'));

    (createPublicClient as jest.Mock).mockReturnValue({
      simulateContract: mockSimulateContract,
      getTransactionCount: mockGetTransactionCount,
      waitForTransactionReceipt: mockWaitForTransactionReceipt,
    });

    // --- Wallet client mock ---
    mockWriteContract = jest.fn().mockResolvedValue(MOCK_TX_HASH);
    (createWalletClient as jest.Mock).mockReturnValue({
      writeContract: mockWriteContract,
    });

    // --- Prisma mock ---
    prisma = {
      deal: {
        update: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    // --- Module ---
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OracleRelayerService,
        { provide: PrismaService, useValue: prisma },
      ],
    })
      .setLogger(new Logger())
      .compile();

    service = module.get<OracleRelayerService>(OracleRelayerService);
    service.onModuleInit(); // manually trigger lifecycle
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. Happy paths
  // -------------------------------------------------------------------------

  describe('startInspection — happy path', () => {
    it('should broadcast tx and update DB to IN_INSPECTION', async () => {
      const dealId = '550e8400-e29b-41d4-a716-446655440000';
      const result = await service.startInspection(dealId);

      expect(mockSimulateContract).toHaveBeenCalledTimes(1);
      expect(mockWriteContract).toHaveBeenCalledTimes(1);
      expect(mockWaitForTransactionReceipt).toHaveBeenCalledWith(
        expect.objectContaining({ hash: MOCK_TX_HASH }),
      );
      expect(prisma.deal.update).toHaveBeenCalledWith({
        where: { id: dealId },
        data: expect.objectContaining({
          state: 'IN_INSPECTION',
          settleTxHash: MOCK_TX_HASH,
        }),
      });
      expect(result).toEqual({
        txHash: MOCK_TX_HASH,
        receipt: makeReceipt('success'),
      });
    });
  });

  describe('settle — happy path', () => {
    it('should broadcast tx and update DB to SETTLED', async () => {
      const dealId = '550e8400-e29b-41d4-a716-446655440001';
      const result = await service.settle(dealId);

      expect(mockWriteContract).toHaveBeenCalledTimes(1);
      expect(prisma.deal.update).toHaveBeenCalledWith({
        where: { id: dealId },
        data: expect.objectContaining({
          state: 'SETTLED',
          settleTxHash: MOCK_TX_HASH,
        }),
      });
      expect(result?.txHash).toBe(MOCK_TX_HASH);
    });
  });

  describe('resolveDispute — APPROVE_PAYOUT', () => {
    it('should call resolveDispute(id, false) and update DB to SETTLED', async () => {
      const dealId = '550e8400-e29b-41d4-a716-446655440002';
      const result = await service.resolveDispute(dealId, 'APPROVE_PAYOUT');

      const writeArgs = mockWriteContract.mock.calls[0][0] as {
        functionName: string;
        args: unknown[];
      };
      expect(writeArgs.functionName).toBe('resolveDispute');
      expect(writeArgs.args[1]).toBe(false); // refundBuyer = false

      expect(prisma.deal.update).toHaveBeenCalledWith({
        where: { id: dealId },
        data: expect.objectContaining({
          state: 'SETTLED',
          disputeTxHash: MOCK_TX_HASH,
        }),
      });
      expect(result?.txHash).toBe(MOCK_TX_HASH);
    });
  });

  describe('resolveDispute — TRIGGER_REFUND', () => {
    it('should call resolveDispute(id, true) and update DB to REFUNDED', async () => {
      const dealId = '550e8400-e29b-41d4-a716-446655440003';
      const result = await service.resolveDispute(dealId, 'TRIGGER_REFUND');

      const writeArgs = mockWriteContract.mock.calls[0][0] as {
        functionName: string;
        args: unknown[];
      };
      expect(writeArgs.functionName).toBe('resolveDispute');
      expect(writeArgs.args[1]).toBe(true); // refundBuyer = true

      expect(prisma.deal.update).toHaveBeenCalledWith({
        where: { id: dealId },
        data: expect.objectContaining({
          state: 'REFUNDED',
          disputeTxHash: MOCK_TX_HASH,
        }),
      });
      expect(result?.txHash).toBe(MOCK_TX_HASH);
    });
  });

  // -------------------------------------------------------------------------
  // 2. ESCALATE_TO_ADMIN bypass
  // -------------------------------------------------------------------------

  describe('resolveDispute — ESCALATE_TO_ADMIN', () => {
    it('should return null without broadcasting any tx', async () => {
      const dealId = '550e8400-e29b-41d4-a716-446655440004';
      const result = await service.resolveDispute(dealId, 'ESCALATE_TO_ADMIN');

      expect(result).toBeNull();
      expect(mockWriteContract).not.toHaveBeenCalled();
      expect(mockSimulateContract).not.toHaveBeenCalled();
      expect(prisma.deal.update).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // 3. Simulation revert → returns null, does not throw
  // -------------------------------------------------------------------------

  describe('on-chain simulation revert', () => {
    it('should return null and NOT throw when simulateContract rejects', async () => {
      mockSimulateContract.mockRejectedValueOnce(
        Object.assign(new Error('InvalidDealState'), {
          data: '0xdeadbeef',
        }),
      );

      const dealId = '550e8400-e29b-41d4-a716-446655440005';
      const result = await service.settle(dealId);

      expect(result).toBeNull();
      expect(mockWriteContract).not.toHaveBeenCalled();
      expect(prisma.deal.update).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // 4. Receipt status === 'reverted' → returns null
  // -------------------------------------------------------------------------

  describe('receipt reverted on-chain', () => {
    it('should return null and NOT throw when receipt.status is reverted', async () => {
      mockWaitForTransactionReceipt.mockResolvedValueOnce(
        makeReceipt('reverted'),
      );

      const dealId = '550e8400-e29b-41d4-a716-446655440006';
      const result = await service.settle(dealId);

      expect(result).toBeNull();
      // DB must NOT be updated on revert
      expect(prisma.deal.update).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // 5. Nonce sequencing under concurrency
  // -------------------------------------------------------------------------

  describe('nonce sequencing', () => {
    it('should submit transactions with strictly ascending nonces when called concurrently', async () => {
      const capturedNonces: number[] = [];
      let nonce = 10;

      // Each time getTransactionCount is called, it should reflect the
      // "after pending" state. We simulate nonce increment by returning
      // increasing values to prove the mutex forces sequential fetch.
      mockGetTransactionCount.mockImplementation(async () => nonce++);

      mockWriteContract.mockImplementation(async (args: { nonce: number }) => {
        capturedNonces.push(args.nonce);
        return MOCK_TX_HASH;
      });

      const dealIds = [
        '550e8400-e29b-41d4-a716-446655440010',
        '550e8400-e29b-41d4-a716-446655440011',
        '550e8400-e29b-41d4-a716-446655440012',
      ];

      // Fire all three concurrently
      const results = await Promise.all(
        dealIds.map((id) => service.settle(id)),
      );

      // All three should succeed
      results.forEach((r) => expect(r).not.toBeNull());

      // Nonces must be strictly ascending (mutex enforces FIFO ordering)
      expect(capturedNonces).toHaveLength(3);
      for (let i = 1; i < capturedNonces.length; i++) {
        expect(capturedNonces[i]).toBeGreaterThan(capturedNonces[i - 1]);
      }
    });
  });

  // -------------------------------------------------------------------------
  // 6. Helper methods
  // -------------------------------------------------------------------------

  describe('getRelayerAddress', () => {
    it('should return the mock account address', () => {
      expect(service.getRelayerAddress()).toBe(MOCK_ACCOUNT_ADDRESS);
    });
  });

  describe('encodeCalldata', () => {
    it('should return a 0x-prefixed hex string for startInspection', () => {
      const dealId = '550e8400e29b41d4a716446655440000';
      const bytes32 = `0x${dealId.padEnd(64, '0')}` as const;
      const calldata = service.encodeCalldata('startInspection', [bytes32]);
      expect(calldata).toMatch(/^0x[0-9a-fA-F]+$/);
    });
  });
});
