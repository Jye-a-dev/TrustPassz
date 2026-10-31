import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { RelayerFundingService } from './relayer-funding.service';
import { PrismaService } from '../../database/prisma.service';

describe('RelayerFundingService', () => {
  let service: RelayerFundingService;

  const mockPrismaService = {
    relayerFundingLog: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      switch (key) {
        case 'SOLANA_RPC_URL':
          return 'https://api.devnet.solana.com';
        case 'SOLANA_RELAYER_PUBLIC_KEY':
          return 'TrUsT11111111111111111111111111111111111111';
        case 'ALERT_THRESHOLD_SOL':
          return '0.1';
        case 'ADMIN_2FA_PIN':
          return '123456';
        case 'ENFORCE_2FA':
          return 'true';
        default:
          return defaultValue;
      }
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelayerFundingService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<RelayerFundingService>(RelayerFundingService);
    service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should reject invalid 2FA code', async () => {
    await expect(
      service.verifyAndRecordFunding({
        txHash: '5K3y4sFhC8R9E7mN2bV1xP9qW4zL6kM3jH8gF5dC2aB1',
        senderWallet: '7nxQL...senderPublicKey...XyZ',
        amountSol: 1.0,
        twoFactorCode: '000000',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should reject missing 2FA code when enforced', async () => {
    await expect(
      service.verifyAndRecordFunding({
        txHash: '5K3y4sFhC8R9E7mN2bV1xP9qW4zL6kM3jH8gF5dC2aB1',
        senderWallet: '7nxQL...senderPublicKey...XyZ',
        amountSol: 1.0,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should reject duplicate txHash (replay attack prevention)', async () => {
    mockPrismaService.relayerFundingLog.findUnique.mockResolvedValue({
      id: 'existing-id',
      txHash: '5K3y4sFhC8R9E7mN2bV1xP9qW4zL6kM3jH8gF5dC2aB1',
    });

    await expect(
      service.verifyAndRecordFunding({
        txHash: '5K3y4sFhC8R9E7mN2bV1xP9qW4zL6kM3jH8gF5dC2aB1',
        senderWallet: '7nxQL...senderPublicKey...XyZ',
        amountSol: 1.0,
        twoFactorCode: '123456',
      }),
    ).rejects.toThrow(ConflictException);
  });
});

