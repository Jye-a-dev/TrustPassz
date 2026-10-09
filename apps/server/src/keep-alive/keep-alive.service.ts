import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import axios from 'axios';
import { CronJob } from 'cron';
import { PrismaService } from '../database/prisma.service';

export interface KeepAliveProbeResult {
  success: boolean;
  latencyMs: number;
  status?: number;
  error?: string;
}

export interface KeepAliveCycleReport {
  timestamp: string;
  database: KeepAliveProbeResult;
  server: KeepAliveProbeResult;
  aiPipeline: KeepAliveProbeResult;
}

@Injectable()
export class KeepAliveService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KeepAliveService.name);
  private keepAliveJob?: CronJob;
  private lastReport?: KeepAliveCycleReport;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  async onModuleInit(): Promise<void> {
    const isEnabled =
      this.configService.get<string>('KEEP_ALIVE_ENABLED', 'true') !== 'false';
    if (!isEnabled) {
      this.logger.log(
        '[KeepAliveService] Keep-alive worker disabled via KEEP_ALIVE_ENABLED=false',
      );
      return;
    }

    const cronPattern = this.configService.get<string>(
      'KEEP_ALIVE_INTERVAL_CRON',
      '*/4 * * * *',
    );

    try {
      const job = new CronJob(
        cronPattern,
        async () => {
          try {
            await this.executeKeepAliveCycle();
          } catch (cycleErr: unknown) {
            const msg =
              cycleErr instanceof Error ? cycleErr.message : String(cycleErr);
            this.logger.error(
              `[KeepAliveService] Cycle execution error: ${msg}`,
            );
          }
        },
        null,
        true,
        undefined,
        null,
        false,
        null,
        true,
      );

      this.schedulerRegistry.addCronJob('neon-anti-idle-worker', job);
      this.keepAliveJob = job;
      this.logger.log(
        `[KeepAliveService] Anti-idle worker active — schedule: "${cronPattern}"`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `[KeepAliveService] Failed to schedule cron job "${cronPattern}": ${msg}`,
      );
    }
  }

  onModuleDestroy(): void {
    if (this.keepAliveJob) {
      this.keepAliveJob.stop();
      this.logger.log('[KeepAliveService] Anti-idle worker stopped.');
    }
  }

  /**
   * Pings Neon PostgreSQL using lightweight query (SELECT 1;) to prevent
   * scale-to-zero / auto-suspension on serverless tier.
   */
  async pingNeonDatabase(): Promise<KeepAliveProbeResult> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1 as ping;`;
      const latencyMs = Date.now() - start;
      this.logger.log(`[Neon Keep-Alive] Ping DB OK (${latencyMs}ms)`);
      return { success: true, latencyMs };
    } catch (err: unknown) {
      const latencyMs = Date.now() - start;
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`[Neon Keep-Alive] Ping DB warning: ${msg}`);
      return { success: false, latencyMs, error: msg };
    }
  }

  /**
   * Resilient HTTP probe with retry and exponential backoff to ensure
   * external endpoints maintain HTTP 200 OK.
   */
  async pingHttpEndpoint(
    url: string,
    targetName: string,
    maxRetries = 2,
    timeoutMs = 5000,
  ): Promise<KeepAliveProbeResult> {
    const start = Date.now();
    let lastError = '';
    let lastStatus: number | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.get(url, {
          timeout: timeoutMs,
          validateStatus: () => true,
        });
        lastStatus = response.status;

        if (response.status === 200) {
          const latencyMs = Date.now() - start;
          this.logger.log(
            `[Health Worker] ${targetName} (${url}) -> 200 OK (${latencyMs}ms)`,
          );
          return { success: true, status: 200, latencyMs };
        }

        lastError = `HTTP ${response.status}`;
        this.logger.warn(
          `[Health Worker] ${targetName} responded ${lastError} (attempt ${attempt}/${maxRetries})`,
        );
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `[Health Worker] ${targetName} probe error: ${lastError} (attempt ${attempt}/${maxRetries})`,
        );
      }

      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, attempt * 500));
      }
    }

    const latencyMs = Date.now() - start;
    this.logger.warn(
      `[Health Worker Warning] ${targetName} unreachable after ${maxRetries} tries: ${lastError}`,
    );
    return {
      success: false,
      status: lastStatus,
      latencyMs,
      error: lastError,
    };
  }

  /**
   * Executes a complete keep-alive cycle across DB and microservice health checks.
   */
  async executeKeepAliveCycle(): Promise<KeepAliveCycleReport> {
    const serverUrl = this.resolveServerHealthUrl();
    const aiUrl = this.resolveAiPipelineHealthUrl();

    const [dbResult, serverResult, aiResult] = await Promise.all([
      this.pingNeonDatabase(),
      serverUrl
        ? this.pingHttpEndpoint(serverUrl, 'NestJS Server')
        : Promise.resolve({ success: true, latencyMs: 0 }),
      aiUrl
        ? this.pingHttpEndpoint(aiUrl, 'AI Pipeline')
        : Promise.resolve({ success: true, latencyMs: 0 }),
    ]);

    this.lastReport = {
      timestamp: new Date().toISOString(),
      database: dbResult,
      server: serverResult,
      aiPipeline: aiResult,
    };

    return this.lastReport;
  }

  getLastReport(): KeepAliveCycleReport | undefined {
    return this.lastReport;
  }

  private resolveServerHealthUrl(): string {
    const configured = this.configService.get<string>('SERVER_HEALTH_URL');
    if (configured) return configured;
    const port = this.configService.get<string>('PORT') || '3000';
    return `http://127.0.0.1:${port}/api/v1/health`;
  }

  private resolveAiPipelineHealthUrl(): string {
    const configured = this.configService.get<string>('AI_PIPELINE_HEALTH_URL');
    if (configured) return configured;
    const base = this.configService.get<string>(
      'AI_PIPELINE_URL',
      'http://127.0.0.1:3100',
    );
    return `${base.replace(/\/+$/, '')}/health`;
  }
}

