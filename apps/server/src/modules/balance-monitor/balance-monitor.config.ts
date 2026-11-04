/**
 * balance-monitor.config.ts
 *
 * Strongly-typed environment configuration loader for Oracle Relayer Balance Monitor.
 * Loads and sanitizes secrets, threshold values, and notification endpoints.
 * Prevents raw private keys and complete Sentry DSNs from leaking into logs.
 */

import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { privateKeyToAccount } from 'viem/accounts';

export interface BalanceMonitorConfig {
  /** EVM Base Sepolia Relayer address (0x-prefixed, 20 bytes) */
  readonly oracleRelayerAddress: `0x${string}`;
  /** Solana SVM Relayer Public Key (Base58) */
  readonly solanaRelayerPublicKey: string;
  /** ETH warning threshold (default: 0.02 ETH) */
  readonly alertThresholdEth: number;
  /** SOL warning threshold (default: 0.1 SOL) */
  readonly alertThresholdSol: number;
  /** Telegram Bot API Token */
  readonly telegramBotToken?: string;
  /** Telegram target Chat / Channel ID */
  readonly telegramChatId?: string;
  /** Discord Incoming Webhook URL */
  readonly discordWebhookUrl?: string;
  /** Sentry DSN for exception & warning telemetry */
  readonly sentryDsn?: string;
  /** Cron pattern (e.g. every 5 minutes) */
  readonly cronSchedule: string;
  /** Cooldown TTL in milliseconds to prevent alert spam (default: 60 minutes) */
  readonly cooldownMs: number;
  /** Primary RPC endpoint for Base Sepolia */
  readonly baseSepoliaRpcUrl: string;
  /** Primary RPC endpoint for Solana */
  readonly solanaRpcUrl: string;
  /** Optional Alchemy API Key for EVM fallback */
  readonly alchemyApiKey?: string;
  /** Optional Infura API Key for EVM fallback */
  readonly infuraApiKey?: string;
  /** Flag to toggle background worker */
  readonly enabled: boolean;
}

const logger = new Logger('BalanceMonitorConfig');

/**
 * Sanitizes arbitrary secrets by replacing internal bytes with asterisks.
 */
export function maskSecret(secret?: string): string {
  if (!secret || secret.trim().length === 0) return '(not configured)';
  const trimmed = secret.trim();
  if (trimmed.length <= 8) return '********';
  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}

/**
 * Masks Sentry DSN to obscure client credentials in log outputs.
 */
export function maskDsn(dsn?: string): string {
  if (!dsn || dsn.trim().length === 0) return '(not configured)';
  try {
    const parsed = new URL(dsn.trim());
    return `${parsed.protocol}//***@${parsed.host}${parsed.pathname}`;
  } catch {
    return '***';
  }
}

/**
 * Loads and validates configuration parameters from NestJS ConfigService.
 */
export function loadBalanceMonitorConfig(
  configService: ConfigService,
): BalanceMonitorConfig {
  const isProd = configService.get<string>('NODE_ENV') === 'production';

  // 1. Resolve EVM Address (Direct address or derived from Relayer Private Key)
  let rawEvmAddress = configService.get<string>('ORACLE_RELAYER_ADDRESS');
  const rawEvmPrivateKey = configService.get<string>(
    'ORACLE_RELAYER_PRIVATE_KEY',
  );

  if (
    !rawEvmAddress &&
    rawEvmPrivateKey &&
    /^0x[0-9a-fA-F]{64}$/.test(rawEvmPrivateKey)
  ) {
    try {
      rawEvmAddress = privateKeyToAccount(
        rawEvmPrivateKey as `0x${string}`,
      ).address;
    } catch {
      // Fall through to validation check
    }
  }

  if (!rawEvmAddress || !/^0x[0-9a-fA-F]{40}$/.test(rawEvmAddress)) {
    if (isProd) {
      throw new Error(
        '[BalanceMonitorConfig] ORACLE_RELAYER_ADDRESS (or valid ORACLE_RELAYER_PRIVATE_KEY) is required in production.',
      );
    }
    // Deterministic fallback for local development & test harnesses
    rawEvmAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    logger.warn(
      `[BalanceMonitorConfig] ORACLE_RELAYER_ADDRESS missing. Using development address: ${rawEvmAddress}`,
    );
  }

  // 2. Resolve Solana Relayer Public Key
  let rawSolanaKey = configService.get<string>('SOLANA_RELAYER_PUBLIC_KEY');
  if (!rawSolanaKey || rawSolanaKey.trim().length === 0) {
    if (isProd) {
      throw new Error(
        '[BalanceMonitorConfig] SOLANA_RELAYER_PUBLIC_KEY is required in production.',
      );
    }
    rawSolanaKey = 'F9zXgYmojDjHnjiRCtNLb46ruUorjrWeEDBxF2dFkJjn';
    logger.warn(
      `[BalanceMonitorConfig] SOLANA_RELAYER_PUBLIC_KEY missing. Using development Solflare Devnet key: ${rawSolanaKey}`,
    );
  }

  // 3. Thresholds & Intervals
  const alertThresholdEth = parseFloat(
    configService.get<string>('ALERT_THRESHOLD_ETH') ?? '0.02',
  );
  const alertThresholdSol = parseFloat(
    configService.get<string>('ALERT_THRESHOLD_SOL') ?? '0.1',
  );
  const cronSchedule =
    configService.get<string>('BALANCE_CHECK_CRON') ?? '*/5 * * * *';
  const cooldownMs = parseInt(
    configService.get<string>('ALERT_COOLDOWN_MS') ?? '3600000',
    10,
  );
  const enabled =
    configService.get<string>('BALANCE_MONITOR_ENABLED', 'true') !== 'false';

  // 4. RPC Networks
  const baseSepoliaRpcUrl =
    configService.get<string>('BASE_SEPOLIA_RPC_URL') ??
    'https://sepolia.base.org';
  const solanaRpcUrl =
    configService.get<string>('SOLANA_RPC_URL') ??
    'https://api.devnet.solana.com';

  // 5. Alert Integrations
  const telegramBotToken = configService
    .get<string>('TELEGRAM_BOT_TOKEN')
    ?.trim();
  const telegramChatId = configService.get<string>('TELEGRAM_CHAT_ID')?.trim();
  const discordWebhookUrl = configService
    .get<string>('DISCORD_WEBHOOK_URL')
    ?.trim();
  const sentryDsn = configService.get<string>('SENTRY_DSN')?.trim();

  const alchemyApiKey = configService.get<string>('ALCHEMY_API_KEY')?.trim();
  const infuraApiKey = configService.get<string>('INFURA_API_KEY')?.trim();

  logger.log(
    `[BalanceMonitorConfig] Configured — EVM: ${rawEvmAddress} (Threshold: ${alertThresholdEth} ETH) | SVM: ${rawSolanaKey} (Threshold: ${alertThresholdSol} SOL) | Telegram: ${telegramBotToken ? 'enabled' : 'disabled'} | Discord: ${discordWebhookUrl ? 'enabled' : 'disabled'} | Sentry: ${maskDsn(sentryDsn)}`,
  );

  return {
    oracleRelayerAddress: rawEvmAddress as `0x${string}`,
    solanaRelayerPublicKey: rawSolanaKey.trim(),
    alertThresholdEth: Number.isNaN(alertThresholdEth)
      ? 0.02
      : alertThresholdEth,
    alertThresholdSol: Number.isNaN(alertThresholdSol)
      ? 0.1
      : alertThresholdSol,
    telegramBotToken: telegramBotToken || undefined,
    telegramChatId: telegramChatId || undefined,
    discordWebhookUrl: discordWebhookUrl || undefined,
    sentryDsn: sentryDsn || undefined,
    cronSchedule,
    cooldownMs: Number.isNaN(cooldownMs) ? 3600000 : cooldownMs,
    baseSepoliaRpcUrl,
    solanaRpcUrl,
    alchemyApiKey: alchemyApiKey || undefined,
    infuraApiKey: infuraApiKey || undefined,
    enabled,
  };
}
