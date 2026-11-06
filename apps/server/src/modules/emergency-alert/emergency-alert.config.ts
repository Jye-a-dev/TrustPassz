/**
 * emergency-alert.config.ts
 *
 * Strongly-typed environment configuration loader for Exclusive Gmail Emergency Alerts.
 * Validates SMTP/Gmail parameters, admin recipient lists, and debounce intervals.
 * Masks credentials during bootstrap logging to prevent leakages.
 */

import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmergencyAlertConfig {
  readonly smtpHost: string;
  readonly smtpPort: number;
  readonly smtpSecure: boolean;
  readonly smtpUser: string;
  readonly smtpPass: string;
  readonly senderName: string;
  readonly adminEmails: string[];
  readonly debounceTtlSec: number;
  readonly adminDashboardUrl: string;
  readonly enabled: boolean;
}

const logger = new Logger('EmergencyAlertConfig');

/**
 * Obscures sensitive secret values in log outputs.
 */
export function maskSecret(secret?: string): string {
  if (!secret || secret.trim().length === 0) return '(not configured)';
  const trimmed = secret.trim();
  if (trimmed.length <= 6) return '******';
  return `${trimmed.slice(0, 2)}***${trimmed.slice(-2)}`;
}

/**
 * Masks email address for safe logging.
 */
export function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return maskSecret(email);
  const [user, domain] = parts;
  const maskedUser = user.length <= 2 ? `${user}*` : `${user.slice(0, 2)}***`;
  return `${maskedUser}@${domain}`;
}

/**
 * Parses comma-separated recipient emails with trim and RFC format sanitation.
 */
export function parseAdminEmails(raw?: string): string[] {
  if (!raw || raw.trim().length === 0) return [];
  return raw
    .split(',')
    .map((e) => e.trim())
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
}

/**
 * Loads and validates emergency alert SMTP configuration from NestJS ConfigService.
 */
export function loadEmergencyAlertConfig(
  configService: ConfigService,
): EmergencyAlertConfig {
  const isProd = configService.get<string>('NODE_ENV') === 'production';

  const smtpHost =
    configService.get<string>('SMTP_HOST')?.trim() || 'smtp.gmail.com';
  const rawPort = configService.get<string>('SMTP_PORT')?.trim() || '465';
  const smtpPort = parseInt(rawPort, 10) || 465;

  const rawSecure = configService.get<string>('SMTP_SECURE')?.trim();
  const smtpSecure =
    rawSecure !== undefined ? rawSecure === 'true' : smtpPort === 465;

  const smtpUser = configService.get<string>('SMTP_USER')?.trim() || '';
  const smtpPass = configService.get<string>('SMTP_PASS')?.trim() || '';
  const senderName =
    configService.get<string>('SMTP_FROM_NAME')?.trim() ||
    'TrustPassz Security Sentinel';

  const rawAdmins = configService.get<string>('EMERGENCY_ADMIN_EMAILS');
  const adminEmails = parseAdminEmails(rawAdmins);

  const rawDebounce = configService.get<string>('ALERT_DEBOUNCE_TTL_SEC');
  const debounceTtlSec = parseInt(rawDebounce || '300', 10) || 300;

  const adminDashboardUrl =
    configService.get<string>('ADMIN_DASHBOARD_URL')?.trim() ||
    'https://trustpassz.io/admin/system';

  const enabled =
    configService.get<string>('EMERGENCY_ALERT_ENABLED', 'true') !== 'false';

  if (isProd && enabled) {
    if (!smtpUser || !smtpPass) {
      throw new Error(
        '[EmergencyAlertConfig] SMTP_USER and SMTP_PASS are mandatory in production.',
      );
    }
    if (adminEmails.length === 0) {
      throw new Error(
        '[EmergencyAlertConfig] At least one valid email in EMERGENCY_ADMIN_EMAILS is required in production.',
      );
    }
  }

  const maskedAdmins = adminEmails.map((e) => maskEmail(e)).join(', ');
  logger.log(
    `[EmergencyAlertConfig] Initialized — Host: ${smtpHost}:${smtpPort} (Secure: ${smtpSecure}) | Sender: ${maskEmail(smtpUser || 'dev@trustpassz.local')} | Recipients: [${maskedAdmins || 'none'}] | Debounce: ${debounceTtlSec}s | Enabled: ${enabled}`,
  );

  return {
    smtpHost,
    smtpPort,
    smtpSecure,
    smtpUser,
    smtpPass,
    senderName,
    adminEmails,
    debounceTtlSec,
    adminDashboardUrl,
    enabled,
  };
}

