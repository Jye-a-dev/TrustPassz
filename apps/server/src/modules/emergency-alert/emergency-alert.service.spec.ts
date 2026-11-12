/**
 * emergency-alert.service.spec.ts
 *
 * Test suite for EmergencyAlertService (TASK-c-3).
 * Validates:
 *   1. Critical email alert dispatch with format `[EMERGENCY - TRUSTPASSZ] <summary>`.
 *   2. Non-blocking latency SLA (< 3000ms dispatch time).
 *   3. Debounce lock: 5 alerts with same fingerprint in 10s results in only 1 email dispatched.
 *   4. Debounce TTL expiration (> 300s): subsequent alert is allowed and dispatched.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import {
  EmergencyAlertService,
  AlertDispatchResult,
  CriticalAlertEvent,
} from './emergency-alert.service';

jest.mock('nodemailer');

describe('EmergencyAlertService (TASK-c-3: Exclusive Gmail Emergency Alert)', () => {
  let service: EmergencyAlertService;
  let sendMailMock: jest.Mock;

  const mockAdminEmails = 'admin1@trustpassz.io, admin2@trustpassz.io';
  const mockConfigValues: Record<string, string> = {
    NODE_ENV: 'test',
    SMTP_HOST: 'smtp.gmail.com',
    SMTP_PORT: '465',
    SMTP_SECURE: 'true',
    SMTP_USER: 'sentinel@trustpassz.io',
    SMTP_PASS: 'app-password-secret-1234',
    SMTP_FROM_NAME: 'TrustPassz Emergency Sentinel',
    EMERGENCY_ADMIN_EMAILS: mockAdminEmails,
    ALERT_DEBOUNCE_TTL_SEC: '300',
    ADMIN_DASHBOARD_URL: 'https://trustpassz.io/admin/system',
    EMERGENCY_ALERT_ENABLED: 'true',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    sendMailMock = jest.fn().mockImplementation(async (mailOptions) => {
      // Simulate fast network dispatch
      return {
        messageId: `<mock-${Date.now()}@trustpassz.io>`,
        accepted: mailOptions.to,
        rejected: [],
        pending: [],
        response: '250 2.0.0 OK',
        envelope: { from: mailOptions.from, to: mailOptions.to },
      };
    });

    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
      close: jest.fn(),
      verify: jest.fn().mockResolvedValue(true),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmergencyAlertService,
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

    service = module.get<EmergencyAlertService>(EmergencyAlertService);
    service.onModuleInit();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  describe('1. Critical Email Dispatch & Subject Formatting', () => {
    it('should dispatch email successfully with prefix [EMERGENCY - TRUSTPASSZ]', async () => {
      const event: CriticalAlertEvent = {
        service: 'OracleRelayerService',
        errorCode: 'RELAYER_ONCHAIN_REVERT',
        summary: 'On-chain Settlement Transaction Reverted',
        message: 'Contract call settle() reverted at block 12938472.',
        stackTrace: 'Error: execution reverted: InsufficientCollateral\n  at OracleRelayerService.settle',
        metadata: { dealId: 'deal-uuid-123', txHash: '0xabcdef' },
      };

      const result = await service.triggerCriticalAlert(event);

      expect(result.success).toBe(true);
      expect(result.suppressed).toBe(false);
      expect(result.recipientsCount).toBe(2);
      expect(sendMailMock).toHaveBeenCalledTimes(1);

      const sentPayload = sendMailMock.mock.calls[0][0];
      expect(sentPayload.subject).toBe(
        '[EMERGENCY - TRUSTPASSZ] On-chain Settlement Transaction Reverted',
      );
      expect(sentPayload.to).toEqual([
        'admin1@trustpassz.io',
        'admin2@trustpassz.io',
      ]);
      expect(sentPayload.html).toContain('CRITICAL ALERT');
      expect(sentPayload.html).toContain('RELAYER_ONCHAIN_REVERT');
      expect(sentPayload.html).toContain('Mở Dispute / Server Matrix (/admin/system)');
    });
  });

  describe('2. Dispatch Latency & Non-blocking SLA (< 3000ms)', () => {
    it('should dispatch alert within 3000ms SLA latency threshold', async () => {
      const event: CriticalAlertEvent = {
        service: 'BalanceMonitorService',
        errorCode: 'RELAYER_LOW_BALANCE',
        summary: 'Base Sepolia Relayer Balance Depleted',
        message: 'Oracle Relayer gas balance is 0.008 ETH (< 0.02 ETH).',
      };

      const start = Date.now();
      const result = await service.triggerCriticalAlert(event);
      const elapsed = Date.now() - start;

      expect(result.success).toBe(true);
      expect(result.durationMs).toBeLessThan(3000);
      expect(elapsed).toBeLessThan(3000);
    });
  });

  describe('3. In-Memory Debounce Mechanism (Anti-Spam Flooding)', () => {
    it('should send only 1 email when 5 identical alerts trigger within 10 seconds', async () => {
      const event: CriticalAlertEvent = {
        service: 'VietQrService',
        errorCode: 'PAYOS_WEBHOOK_CONSECUTIVE_FAILURES',
        summary: 'PayOS Webhook Verification Failed 3 Times',
        message: 'Repeated HMAC-SHA256 signature verification mismatches detected.',
      };

      const results: AlertDispatchResult[] = [];
      // Fire 5 alerts concurrently / rapidly within milliseconds
      for (let i = 0; i < 5; i++) {
        results.push(await service.triggerCriticalAlert(event));
      }

      // First alert must succeed and dispatch email
      expect(results[0].success).toBe(true);
      expect(results[0].suppressed).toBe(false);

      // Subsequent 4 alerts must be suppressed by debounce cache
      for (let i = 1; i < 5; i++) {
        expect(results[i].success).toBe(false);
        expect(results[i].suppressed).toBe(true);
      }

      // Exactly 1 email sent to SMTP
      expect(sendMailMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('4. Debounce TTL Expiration (> 300s / 5 minutes)', () => {
    it('should allow re-sending alert once the 5-minute cooldown window has passed', async () => {
      const event: CriticalAlertEvent = {
        service: 'DatabaseHealthCheck',
        errorCode: 'DATABASE_CONNECTION_LOST',
        summary: 'Neon PostgreSQL Connection Exhausted',
        message: 'Prisma ping query failed: connection pool timeout after 5000ms.',
      };

      // 1. First trigger
      const firstResult = await service.triggerCriticalAlert(event);
      expect(firstResult.success).toBe(true);
      expect(sendMailMock).toHaveBeenCalledTimes(1);

      // 2. Immediate second trigger -> Suppressed
      const secondResult = await service.triggerCriticalAlert(event);
      expect(secondResult.suppressed).toBe(true);
      expect(sendMailMock).toHaveBeenCalledTimes(1);

      // 3. Fast-forward clock by 301 seconds (past 300s TTL)
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now + 301_000);

      // 4. Third trigger -> Must be permitted and dispatched
      const thirdResult = await service.triggerCriticalAlert(event);
      expect(thirdResult.success).toBe(true);
      expect(thirdResult.suppressed).toBe(false);
      expect(sendMailMock).toHaveBeenCalledTimes(2);

      jest.restoreAllMocks();
    });
  });
});
