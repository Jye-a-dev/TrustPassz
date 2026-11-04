/**
 * balance-monitor.service.ts
 *
 * TASK-b-05: Oracle Relayer Balance Monitor & Alert Service (Cronjob & Sentry)
 * Periodically audits multi-chain relayer gas reserves (Base Sepolia EVM & Solana SVM).
 * Dispatches non-blocking alerts to Telegram, Discord, and Sentry with debounce cooldowns.
 */

import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import axios from 'axios';
import { CronJob } from 'cron';
import { createPublicClient, formatEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createViemFallbackTransport } from '../../lib/viem-client';
import {
  loadBalanceMonitorConfig,
  type BalanceMonitorConfig,
} from './balance-monitor.config';

export interface ChainBalanceResult {
  chain: 'base-sepolia' | 'solana';
  address: string;
  balance: number;
  formattedBalance: string;
  threshold: number;
  isLowBalance: boolean;
  estimatedTxRemaining: number;
  success: boolean;
  error?: string;
}

export interface BalanceCheckReport {
  timestamp: string;
  evm: ChainBalanceResult;
  solana: ChainBalanceResult;
}

interface ChainAlertState {
  chain: 'base-sepolia' | 'solana';
  isAlertActive: boolean;
  lastAlertTimestamp: number;
  lastReportedBalance: number;
}

@Injectable()
export class BalanceMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BalanceMonitorService.name);

  private config!: BalanceMonitorConfig;
  private publicClient!: { getBalance(args: { address: `0x${string}` }): Promise<bigint> };
  private solanaConnection!: Connection;
  private cronJob?: CronJob;

  private readonly alertStates = new Map<'base-sepolia' | 'solana', ChainAlertState>([
    ['base-sepolia', { chain: 'base-sepolia', isAlertActive: false, lastAlertTimestamp: 0, lastReportedBalance: 0 }],
    ['solana', { chain: 'solana', isAlertActive: false, lastAlertTimestamp: 0, lastReportedBalance: 0 }],
  ]);

  constructor(
    private readonly configService: ConfigService,
    @Optional() private readonly schedulerRegistry?: SchedulerRegistry,
  ) {}

  onModuleInit(): void {
    this.config = loadBalanceMonitorConfig(this.configService);

    this.publicClient = createPublicClient({
      chain: baseSepolia,
      transport: createViemFallbackTransport({
        primaryRpcUrl: this.config.baseSepoliaRpcUrl,
        alchemyApiKey: this.config.alchemyApiKey,
        infuraApiKey: this.config.infuraApiKey,
      }),
    });

    this.solanaConnection = new Connection(this.config.solanaRpcUrl, { commitment: 'confirmed' });

    if (!this.config.enabled) {
      this.logger.log('BalanceMonitorService background cron is disabled.');
      return;
    }

    try {
      this.cronJob = new CronJob(this.config.cronSchedule, async () => {
        try {
          await this.checkBalances();
        } catch (jobErr: unknown) {
          const msg = jobErr instanceof Error ? jobErr.message : String(jobErr);
          this.logger.error(`Error during scheduled balance monitor cycle: ${msg}`);
        }
      });

      if (this.schedulerRegistry) {
        this.schedulerRegistry.addCronJob('oracle-relayer-balance-monitor', this.cronJob);
      }
      this.cronJob.start();
      this.logger.log(`BalanceMonitorService scheduled with cron pattern [${this.config.cronSchedule}]`);
    } catch (schedErr: unknown) {
      const msg = schedErr instanceof Error ? schedErr.message : String(schedErr);
      this.logger.warn(`Failed to schedule balance monitor cron: ${msg}`);
    }
  }

  onModuleDestroy(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      if (this.schedulerRegistry) {
        try {
          this.schedulerRegistry.deleteCronJob('oracle-relayer-balance-monitor');
        } catch {
          // Job already disposed
        }
      }
      this.logger.log('BalanceMonitorService cron stopped.');
    }
  }

  async checkBalances(): Promise<BalanceCheckReport> {
    const timestamp = new Date().toISOString();
    this.logger.log(`[BalanceMonitor] Starting multi-chain balance check cycle`);

    const [evm, solana] = await Promise.all([
      this.queryEvmBalance(),
      this.querySolanaBalance(),
    ]);

    await Promise.allSettled([
      this.handleAlertState(evm),
      this.handleAlertState(solana),
    ]);

    return { timestamp, evm, solana };
  }

  private async queryEvmBalance(): Promise<ChainBalanceResult> {
    const address = this.config.oracleRelayerAddress;
    const threshold = this.config.alertThresholdEth;
    let timerId: NodeJS.Timeout | undefined;

    try {
      const balanceWei = await Promise.race([
        this.publicClient.getBalance({ address }),
        new Promise<never>((_, reject) => {
          timerId = setTimeout(() => reject(new Error('Base Sepolia RPC timeout (10s)')), 10_000);
        }),
      ]);
      clearTimeout(timerId);

      const balance = parseFloat(formatEther(balanceWei));
      return {
        chain: 'base-sepolia',
        address,
        balance,
        formattedBalance: balance.toFixed(4),
        threshold,
        isLowBalance: balance < threshold,
        estimatedTxRemaining: Math.max(0, Math.floor(balance / 0.00005)),
        success: true,
      };
    } catch (error: unknown) {
      if (timerId) clearTimeout(timerId);
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[Base Sepolia] Balance check failed: ${errMsg}`);
      await this.sendSentryWarning(
        `[RPC Error] Base Sepolia balance check failed: ${errMsg}`,
        { chain: 'base-sepolia', address },
        { error: errMsg },
      );
      return {
        chain: 'base-sepolia',
        address,
        balance: 0,
        formattedBalance: '0.0000',
        threshold,
        isLowBalance: false,
        estimatedTxRemaining: 0,
        success: false,
        error: errMsg,
      };
    }
  }

  private async querySolanaBalance(): Promise<ChainBalanceResult> {
    const address = this.config.solanaRelayerPublicKey;
    const threshold = this.config.alertThresholdSol;
    let timerId: NodeJS.Timeout | undefined;

    try {
      const pubKey = new PublicKey(address);
      const lamports = await Promise.race([
        this.solanaConnection.getBalance(pubKey),
        new Promise<never>((_, reject) => {
          timerId = setTimeout(() => reject(new Error('Solana RPC timeout (10s)')), 10_000);
        }),
      ]);
      clearTimeout(timerId);

      const balance = Number(lamports) / Number(LAMPORTS_PER_SOL);
      return {
        chain: 'solana',
        address,
        balance,
        formattedBalance: balance.toFixed(4),
        threshold,
        isLowBalance: balance < threshold,
        estimatedTxRemaining: Math.max(0, Math.floor(balance / 0.000005)),
        success: true,
      };
    } catch (error: unknown) {
      if (timerId) clearTimeout(timerId);
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[Solana] Balance check failed: ${errMsg}`);
      await this.sendSentryWarning(
        `[RPC Error] Solana balance check failed: ${errMsg}`,
        { chain: 'solana', address },
        { error: errMsg },
      );
      return {
        chain: 'solana',
        address,
        balance: 0,
        formattedBalance: '0.0000',
        threshold,
        isLowBalance: false,
        estimatedTxRemaining: 0,
        success: false,
        error: errMsg,
      };
    }
  }

  private async handleAlertState(result: ChainBalanceResult): Promise<void> {
    if (!result.success) return;
    const state = this.alertStates.get(result.chain);
    if (!state) return;

    const now = Date.now();
    const unit = result.chain === 'base-sepolia' ? 'ETH' : 'SOL';
    const chainName = result.chain === 'base-sepolia' ? 'Base Sepolia (EVM)' : 'Solana (SVM)';
    const explorerUrl = result.chain === 'base-sepolia'
      ? `https://sepolia.basescan.org/address/${result.address}`
      : `https://solscan.io/account/${result.address}?cluster=devnet`;

    if (result.isLowBalance) {
      if (state.isAlertActive && now - state.lastAlertTimestamp < this.config.cooldownMs) {
        const remainingMin = Math.round((this.config.cooldownMs - (now - state.lastAlertTimestamp)) / 60000);
        this.logger.log(`[Debounce] Alert for ${result.chain} suppressed. Cooldown active (${remainingMin}m remaining)`);
        return;
      }

      state.isAlertActive = true;
      state.lastAlertTimestamp = now;
      state.lastReportedBalance = result.balance;

      const title = `🚨 [RELAYER GAS ALERT] ${chainName}`;
      this.logger.warn(`${title} — Balance: ${result.formattedBalance} ${unit} < Threshold: ${result.threshold} ${unit}`);

      await this.sendSentryWarning(
        `[RELAYER GAS ALERT] ${result.chain} balance (${result.formattedBalance} ${unit}) is below threshold (${result.threshold} ${unit})`,
        { chain: result.chain, address: result.address, balance: result.formattedBalance },
        { threshold: result.threshold, estimatedTxRemaining: result.estimatedTxRemaining },
      );

      const telegramHtml =
        `🚨 <b>[RELAYER GAS ALERT]</b>\n<b>Chain:</b> ${chainName}\n<b>Wallet:</b> <code>${result.address}</code>\n` +
        `<b>Current Balance:</b> <code>${result.formattedBalance} ${unit}</code>\n<b>Threshold:</b> <code>${result.threshold} ${unit}</code>\n` +
        `<b>Est. Remaining Txs:</b> ~${result.estimatedTxRemaining} txs\n<b>Explorer:</b> <a href="${explorerUrl}">View on Explorer</a>\n` +
        `<b>Action:</b> Refill relayer gas immediately to prevent escrow transaction stalling.`;

      const discordEmbed = {
        title,
        description: 'Oracle Relayer gas is critically low. Refill wallet immediately.',
        color: 0xef4444,
        fields: [
          { name: 'Chain', value: chainName, inline: true },
          { name: 'Current Balance', value: `${result.formattedBalance} ${unit}`, inline: true },
          { name: 'Threshold', value: `${result.threshold} ${unit}`, inline: true },
          { name: 'Est. Remaining Txs', value: `~${result.estimatedTxRemaining} txs`, inline: true },
          { name: 'Wallet Address', value: `[\`${result.address}\`](${explorerUrl})` },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'TrustPassz Reliability Engine' },
      };

      await Promise.allSettled([this.sendTelegram(telegramHtml), this.sendDiscord(discordEmbed)]);
    } else if (state.isAlertActive) {
      state.isAlertActive = false;
      state.lastAlertTimestamp = 0;
      state.lastReportedBalance = result.balance;

      this.logger.log(`[Recovery] Relayer wallet ${result.chain} refilled to ${result.formattedBalance} ${unit}. Cooldown reset.`);

      const telegramRecovery =
        `✅ <b>[RELAYER GAS RECOVERED]</b>\n<b>Status:</b> RESOLVED / FUNDED\n<b>Chain:</b> ${chainName}\n` +
        `<b>Wallet:</b> <code>${result.address}</code>\n<b>Current Balance:</b> <code>${result.formattedBalance} ${unit}</code> (Threshold: ${result.threshold} ${unit})\n` +
        `<b>Notice:</b> Ví Relayer đã được nạp đủ số dư an toàn. Cooldown cảnh báo đã được reset.`;

      const discordRecovery = {
        title: `✅ [RELAYER GAS RECOVERED] ${chainName}`,
        description: 'RESOLVED / FUNDED: Ví Relayer đã được nạp đủ số dư an toàn.',
        color: 0x10b981,
        fields: [
          { name: 'Chain', value: chainName, inline: true },
          { name: 'Balance', value: `${result.formattedBalance} ${unit}`, inline: true },
          { name: 'Threshold', value: `${result.threshold} ${unit}`, inline: true },
          { name: 'Wallet', value: `[\`${result.address}\`](${explorerUrl})` },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'TrustPassz Reliability Engine' },
      };

      await Promise.allSettled([this.sendTelegram(telegramRecovery), this.sendDiscord(discordRecovery)]);
    }
  }

  private async sendSentryWarning(message: string, tags: Record<string, string>, extra: Record<string, unknown>): Promise<void> {
    if (!this.config.sentryDsn) return;
    try {
      const url = new URL(this.config.sentryDsn);
      const endpoint = `${url.protocol}//${url.host}/api/${url.pathname.replace(/^\//, '')}/store/`;
      await axios.post(
        endpoint,
        {
          event_id: Math.random().toString(36).substring(2) + Date.now().toString(36),
          timestamp: new Date().toISOString(),
          platform: 'node',
          level: 'warning',
          logger: 'BalanceMonitorService',
          message: { formatted: message },
          tags,
          extra,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=trustpassz-monitor/1.0, sentry_key=${url.username}`,
          },
          timeout: 5000,
        },
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Failed to dispatch Sentry telemetry: ${msg}`);
    }
  }

  private async sendTelegram(htmlText: string): Promise<void> {
    if (!this.config.telegramBotToken || !this.config.telegramChatId) return;
    try {
      const endpoint = `https://api.telegram.org/bot${this.config.telegramBotToken}/sendMessage`;
      await axios.post(
        endpoint,
        { chat_id: this.config.telegramChatId, text: htmlText, parse_mode: 'HTML', disable_web_page_preview: true },
        { timeout: 8000 },
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to send Telegram alert: ${msg}`);
    }
  }

  private async sendDiscord(embed: Record<string, unknown>): Promise<void> {
    if (!this.config.discordWebhookUrl) return;
    try {
      await axios.post(
        this.config.discordWebhookUrl,
        { username: 'TrustPassz Relayer Sentinel', avatar_url: 'https://trustpassz.io/favicon.ico', embeds: [embed] },
        { timeout: 8000 },
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to send Discord alert: ${msg}`);
    }
  }
}
