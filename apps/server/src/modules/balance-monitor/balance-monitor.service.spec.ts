/**
 * balance-monitor.service.spec.ts
 *
 * Unit test suite for BalanceMonitorService.
 * Validates:
 *   1. Normal balance above threshold -> No alerts triggered.
 *   2. Low balance below threshold -> Telegram, Discord, and Sentry alerts dispatched.
 *   3. Second check during cooldown window -> Debounced (no duplicate alerts).
 *   4. Balance replenished above threshold -> Cooldown reset and recovery notification sent.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { parseEther } from 'viem';
import { BalanceMonitorService } from './balance-monitor.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BalanceMonitorService (TASK-b-05)', () => {
  let service: BalanceMonitorService;
  let getEvmBalanceMock: jest.Mock;
  let getSolanaBalanceMock: jest.Mock;

  const mockConfigValues: Record<string, string> = {
    NODE_ENV: 'test',
    ORACLE_RELAYER_ADDRESS: '0x1234567890123456789012345678901234567890',
    SOLANA_RELAYER_PUBLIC_KEY: '4Nd1mBQtrMJVYVfKf2PJy9NZWsWB8d5KKGuG7xK8xad8',
    ALERT_THRESHOLD_ETH: '0.02',
    ALERT_THRESHOLD_SOL: '0.1',
    TELEGRAM_BOT_TOKEN: 'mock-bot-token',
    TELEGRAM_CHAT_ID: 'mock-chat-id',
    DISCORD_WEBHOOK_URL: 'https://discord.com/api/webhooks/mock-id/mock-token',
    SENTRY_DSN: 'https://mockpubkey@o999999.ingest.sentry.io/123456',
    BALANCE_CHECK_CRON: '*/5 * * * *',
    ALERT_COOLDOWN_MS: '3600000', // 1 hour
    BALANCE_MONITOR_ENABLED: 'false', // Prevent automatic unmocked cron execution in tests
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockedAxios.post.mockResolvedValue({
      status: 200,
      data: { ok: true },
    });

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
      ],
    }).compile();

    service = module.get<BalanceMonitorService>(BalanceMonitorService);
    service.onModuleInit();

    // Mock RPC calls on internal clients
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
      // 1.5 SOL > 0.1 SOL (1.5 * 1e9 lamports)
      getSolanaBalanceMock.mockResolvedValueOnce(1_500_000_000);

      const report = await service.checkBalances();

      expect(report.evm.isLowBalance).toBe(false);
      expect(report.evm.balance).toBe(0.1);
      expect(report.solana.isLowBalance).toBe(false);
      expect(report.solana.balance).toBe(1.5);

      // No dispatch requests should have been made to Telegram, Discord, or Sentry
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('Scenario 2: Balance below thresholds on first scan', () => {
    it('should trigger Sentry warning, Telegram HTML, and Discord Rich Embed alerts', async () => {
      // 0.005 ETH < 0.02 ETH
      getEvmBalanceMock.mockResolvedValueOnce(parseEther('0.005'));
      // 0.05 SOL < 0.1 SOL (0.05 * 1e9 = 50_000_000 lamports)
      getSolanaBalanceMock.mockResolvedValueOnce(50_000_000);

      const report = await service.checkBalances();

      expect(report.evm.isLowBalance).toBe(true);
      expect(report.solana.isLowBalance).toBe(true);

      // Verify that Sentry, Telegram, and Discord endpoints were called
      const calls = mockedAxios.post.mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(4); // 2 chains * (Sentry + Telegram + Discord)

      // 1. Sentry checks
      const sentryCalls = calls.filter(([url]) =>
        String(url).includes('ingest.sentry.io'),
      );
      expect(sentryCalls.length).toBe(2);
      expect((sentryCalls[0][1] as { level: string }).level).toBe('warning');

      // 2. Telegram checks
      const telegramCalls = calls.filter(([url]) =>
        String(url).includes('api.telegram.org'),
      );
      expect(telegramCalls.length).toBe(2);
      expect(telegramCalls[0][1]).toMatchObject({
        chat_id: 'mock-chat-id',
        parse_mode: 'HTML',
      });
      expect(
        (telegramCalls[0][1] as { text: string }).text,
      ).toContain('[RELAYER GAS ALERT]');

      // 3. Discord checks
      const discordCalls = calls.filter(([url]) =>
        String(url).includes('discord.com/api/webhooks'),
      );
      expect(discordCalls.length).toBe(2);
      const discordEmbed = (
        discordCalls[0][1] as { embeds: Array<{ title: string; color: number }> }
      ).embeds[0];
      expect(discordEmbed.title).toContain('[RELAYER GAS ALERT]');
      expect(discordEmbed.color).toBe(0xef4444); // Red warning color
    });
  });

  describe('Scenario 3: Debounce & Cooldown enforcement on repeat scan', () => {
    it('should suppress repeat alerts when balance remains below threshold within cooldown window', async () => {
      // First scan: Trigger alert
      getEvmBalanceMock.mockResolvedValueOnce(parseEther('0.008'));
      getSolanaBalanceMock.mockResolvedValueOnce(40_000_000);

      await service.checkBalances();
      const firstCycleCallCount = mockedAxios.post.mock.calls.length;
      expect(firstCycleCallCount).toBeGreaterThan(0);

      // Reset mock invocation history for clean cycle evaluation
      mockedAxios.post.mockClear();

      // Second scan (shortly after, still low balance)
      getEvmBalanceMock.mockResolvedValueOnce(parseEther('0.0079'));
      getSolanaBalanceMock.mockResolvedValueOnce(39_000_000);

      const secondReport = await service.checkBalances();

      expect(secondReport.evm.isLowBalance).toBe(true);
      expect(secondReport.solana.isLowBalance).toBe(true);

      // All alert dispatches must be debounced / suppressed
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('Scenario 4: Recovery & Cooldown reset when refilled', () => {
    it('should broadcast recovery notification and reset cooldown state when funds replenished', async () => {
      // 1. Enter low balance state
      getEvmBalanceMock.mockResolvedValueOnce(parseEther('0.005'));
      getSolanaBalanceMock.mockResolvedValueOnce(50_000_000);
      await service.checkBalances();

      mockedAxios.post.mockClear();

      // 2. Refill wallet on both chains
      getEvmBalanceMock.mockResolvedValueOnce(parseEther('0.5')); // 0.5 ETH
      getSolanaBalanceMock.mockResolvedValueOnce(2_000_000_000); // 2.0 SOL

      const recoveryReport = await service.checkBalances();
      expect(recoveryReport.evm.isLowBalance).toBe(false);
      expect(recoveryReport.solana.isLowBalance).toBe(false);

      // Verify recovery notices were dispatched
      const recoveryCalls = mockedAxios.post.mock.calls;
      expect(recoveryCalls.length).toBeGreaterThanOrEqual(4);

      const telegramRecovery = recoveryCalls.find(([url]) =>
        String(url).includes('api.telegram.org'),
      );
      expect(
        (telegramRecovery?.[1] as { text: string }).text,
      ).toContain('[RELAYER GAS RECOVERED]');

      const discordRecovery = recoveryCalls.find(([url]) =>
        String(url).includes('discord.com/api/webhooks'),
      );
      const discordRecoveryEmbed = (
        discordRecovery?.[1] as {
          embeds: Array<{ title: string; color: number }>;
        }
      ).embeds[0];
      expect(discordRecoveryEmbed.title).toContain('[RELAYER GAS RECOVERED]');
      expect(discordRecoveryEmbed.color).toBe(0x10b981); // Emerald green
    });
  });
});

