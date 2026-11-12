/**
 * balance-monitor.service.spec.ts
 *
 * Unit test suite for BalanceMonitorService with Exclusive Gmail Emergency Alerts (TASK-c-3).
 * Validates:
 *   1. Normal balance above threshold -> No alerts triggered.
 *   2. Low balance below threshold -> EmergencyAlertService.triggerCriticalAlert & Sentry warning dispatched.
 *   3. Second check during cooldown window -> Debounced (no duplicate alerts).
 *   4. Balance replenished above threshold -> Cooldown reset.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { parseEther } from 'viem';
import { BalanceMonitorService } from './balance-monitor.service';
import { EmergencyAlertService } from '../emergency-alert/emergency-alert.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BalanceMonitorService (TASK-c-3 & TASK-b-05)', () => {
  let service: BalanceMonitorService;
  let emergencyAlertServiceMock: { triggerCriticalAlert: jest.Mock };
  let getEvmBalanceMock: jest.Mock;
  let getSolanaBalanceMock: jest.Mock;

  const mockConfigValues: Record<string, string> = {
    NODE_ENV: 'test',
    ORACLE_RELAYER_ADDRESS: '0x1234567890123456789012345678901234567890',
    SOLANA_RELAYER_PUBLIC_KEY: '4Nd1mBQtrMJVYVfKf2PJy9NZWsWB8d5KKGuG7xK8xad8',
    ALERT_THRESHOLD_ETH: '0.02',
    ALERT_THRESHOLD_SOL: '0.1',
    SENTRY_DSN: 'https://mockpubkey@o999999.ingest.sentry.io/123456',
    BALANCE_CHECK_CRON: '*/5 * * * *',
    ALERT_COOLDOWN_MS: '3600000', // 1 hour
    BALANCE_MONITOR_ENABLED: 'false',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockedAxios.post.mockResolvedValue({
      status: 200,
      data: { ok: true },
    });

    emergencyAlertServiceMock = {
      triggerCriticalAlert: jest.fn().mockResolvedValue({
        success: true,
        fingerprint: 'mock-fp',
        suppressed: false,
        durationMs: 15,
        recipientsCount: 2,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BalanceMonitorService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultVal?: string) => {
              return mockConfigValues[key] ?? defaultVal;
            }),
          },
        },
        {
          provide: EmergencyAlertService,
          useValue: emergencyAlertServiceMock,
        },
      ],
    }).compile();

    service = module.get<BalanceMonitorService>(BalanceMonitorService);
    service.onModuleInit();

    getEvmBalanceMock = jest.fn();
    (service as unknown as { publicClient: { getBalance: jest.Mock } }).publicClient.getBalance =
      getEvmBalanceMock;

    getSolanaBalanceMock = jest.fn();
    (
      service as unknown as { solanaConnection: { getBalance: jest.Mock } }
    ).solanaConnection.getBalance = getSolanaBalanceMock;
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  describe('Scenario 1: Normal balance above thresholds', () => {
    it('should query balances and emit no alerts when both chains are above thresholds', async () => {
      // 0.1 ETH > 0.02 ETH
      getEvmBalanceMock.mockResolvedValueOnce(parseEther('0.1'));
      // 1.5 SOL > 0.1 SOL
      getSolanaBalanceMock.mockResolvedValueOnce(1_500_000_000);

      const report = await service.checkBalances();

      expect(report.evm.isLowBalance).toBe(false);
      expect(report.evm.balance).toBe(0.1);
      expect(report.solana.isLowBalance).toBe(false);
      expect(report.solana.balance).toBe(1.5);

      expect(emergencyAlertServiceMock.triggerCriticalAlert).not.toHaveBeenCalled();
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('Scenario 2: Balance below thresholds on first scan', () => {
    it('should trigger EmergencyAlertService Gmail dispatch and Sentry warning', async () => {
      // 0.005 ETH < 0.02 ETH
      getEvmBalanceMock.mockResolvedValueOnce(parseEther('0.005'));
      // 0.05 SOL < 0.1 SOL
      getSolanaBalanceMock.mockResolvedValueOnce(50_000_000);

      const report = await service.checkBalances();

      expect(report.evm.isLowBalance).toBe(true);
      expect(report.solana.isLowBalance).toBe(true);

      // Verify EmergencyAlertService was invoked for both chains
      expect(emergencyAlertServiceMock.triggerCriticalAlert).toHaveBeenCalledTimes(2);

      const evmCall = emergencyAlertServiceMock.triggerCriticalAlert.mock.calls.find(
        ([payload]) => payload.errorCode === 'ORACLE_RELAYER_LOW_BALANCE_EVM',
      );
      expect(evmCall).toBeDefined();
      expect(evmCall[0].summary).toContain('Số Dư Ví Oracle Relayer');
      expect(evmCall[0].metadata.chain).toBe('base-sepolia');

      const solanaCall = emergencyAlertServiceMock.triggerCriticalAlert.mock.calls.find(
        ([payload]) => payload.errorCode === 'ORACLE_RELAYER_LOW_BALANCE_SVM',
      );
      expect(solanaCall).toBeDefined();
      expect(solanaCall[0].metadata.chain).toBe('solana');

      // Verify Sentry checks
      const sentryCalls = mockedAxios.post.mock.calls.filter(([url]) =>
        String(url).includes('ingest.sentry.io'),
      );
      expect(sentryCalls.length).toBe(2);
    });
  });

  describe('Scenario 3: Debounce & Cooldown enforcement on repeat scan', () => {
    it('should suppress repeat alerts when balance remains below threshold within cooldown window', async () => {
      // First scan: Trigger alert
      getEvmBalanceMock.mockResolvedValueOnce(parseEther('0.008'));
      getSolanaBalanceMock.mockResolvedValueOnce(40_000_000);

      await service.checkBalances();
      expect(emergencyAlertServiceMock.triggerCriticalAlert).toHaveBeenCalledTimes(2);

      emergencyAlertServiceMock.triggerCriticalAlert.mockClear();
      mockedAxios.post.mockClear();

      // Second scan: still low balance within cooldown
      getEvmBalanceMock.mockResolvedValueOnce(parseEther('0.0079'));
      getSolanaBalanceMock.mockResolvedValueOnce(39_000_000);

      const secondReport = await service.checkBalances();

      expect(secondReport.evm.isLowBalance).toBe(true);
      expect(secondReport.solana.isLowBalance).toBe(true);

      // Must be debounced
      expect(emergencyAlertServiceMock.triggerCriticalAlert).not.toHaveBeenCalled();
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('Scenario 4: Recovery & Cooldown reset when refilled', () => {
    it('should reset cooldown state when funds replenished', async () => {
      // 1. Low balance
      getEvmBalanceMock.mockResolvedValueOnce(parseEther('0.005'));
      getSolanaBalanceMock.mockResolvedValueOnce(50_000_000);
      await service.checkBalances();

      emergencyAlertServiceMock.triggerCriticalAlert.mockClear();

      // 2. Replenished
      getEvmBalanceMock.mockResolvedValueOnce(parseEther('0.5'));
      getSolanaBalanceMock.mockResolvedValueOnce(2_000_000_000);

      const recoveryReport = await service.checkBalances();
      expect(recoveryReport.evm.isLowBalance).toBe(false);
      expect(recoveryReport.solana.isLowBalance).toBe(false);
      expect(emergencyAlertServiceMock.triggerCriticalAlert).not.toHaveBeenCalled();
    });
  });
});
