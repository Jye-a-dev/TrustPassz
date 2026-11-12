/**
 * emergency-alert.service.ts
 *
 * TASK-c-3: Exclusive Gmail Emergency Alert Service (SMTP / Google Workspace)
 * 100% Critical level events are dispatched exclusively via Gmail SMTP.
 * Implements non-blocking connection pooling, SLA < 3s dispatch, and 5-minute debounce locks.
 */

import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as os from 'os';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../../database/prisma.service';
import {
  loadEmergencyAlertConfig,
  type EmergencyAlertConfig,
} from './emergency-alert.config';
import {
  renderEmergencyEmailHtml,
  type EmergencyEmailData,
} from './templates/emergency-email.template';

export interface CriticalAlertEvent {
  service: string;
  errorCode: string;
  summary: string;
  message: string;
  stackTrace?: string;
  host?: string;
  environment?: string;
  metadata?: Record<string, unknown>;
}

export interface AlertDispatchResult {
  success: boolean;
  fingerprint: string;
  suppressed: boolean;
  durationMs: number;
  recipientsCount: number;
  messageId?: string;
  error?: string;
}

@Injectable()
export class EmergencyAlertService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmergencyAlertService.name);
  private config!: EmergencyAlertConfig;
  private transporter: nodemailer.Transporter | null = null;
  private readonly debounceCache = new Map<string, number>();

  constructor(
    private readonly configService: ConfigService,
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  getTransporter(): nodemailer.Transporter | null {
    return this.transporter;
  }

  getConfig(): EmergencyAlertConfig {
    return this.config;
  }

  getConfigAdminEmails(): string[] {
    return this.config?.adminEmails || [];
  }

  onModuleInit(): void {
    this.config = loadEmergencyAlertConfig(this.configService);

    if (!this.config.enabled) {
      this.logger.warn('[EmergencyAlertService] Emergency alerts are disabled via config.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: this.config.smtpHost,
        port: this.config.smtpPort,
        secure: this.config.smtpSecure,
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        auth: {
          user: this.config.smtpUser,
          pass: this.config.smtpPass,
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 10000,
      });

      this.logger.log(
        `[EmergencyAlertService] SMTP Pool created for ${this.config.smtpHost}:${this.config.smtpPort} (maxConnections: 5)`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`[EmergencyAlertService] Failed to initialize SMTP Transporter: ${msg}`);
      this.transporter = null;
    }
  }

  onModuleDestroy(): void {
    if (this.transporter && typeof this.transporter.close === 'function') {
      try {
        this.transporter.close();
        this.logger.log('[EmergencyAlertService] SMTP Connection Pool closed gracefully.');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`[EmergencyAlertService] Error closing transport: ${msg}`);
      }
    }
    this.debounceCache.clear();
  }

  /**
   * Generates deterministic SHA-256 fingerprint from error code, service, and summary.
   */
  public generateFingerprint(
    errorCode: string,
    service: string,
    summary: string,
  ): string {
    const rawKey = `${errorCode.trim().toUpperCase()}:${service.trim().toLowerCase()}:${summary.trim().toLowerCase()}`;
    return crypto.createHash('sha256').update(rawKey).digest('hex');
  }

  /**
   * Dispatches critical emergency alert to configured Admin Gmail addresses.
   * Non-blocking, failsafe (never throws to caller), debounced with 5-minute TTL.
   */
  async triggerCriticalAlert(
    event: CriticalAlertEvent,
  ): Promise<AlertDispatchResult> {
    const startTime = Date.now();
    const fingerprint = this.generateFingerprint(
      event.errorCode,
      event.service,
      event.summary,
    );

    // 0. Guard: Check if emergency alert system is enabled
    if (!this.config?.enabled) {
      this.logger.debug(
        `[EmergencyAlertService] Alert [${event.errorCode}] suppressed: EMERGENCY_ALERT_ENABLED is false.`,
      );
      return {
        success: false,
        fingerprint,
        suppressed: true,
        durationMs: Date.now() - startTime,
        recipientsCount: 0,
      };
    }

    // 1. In-Memory Debounce Check (Default: 300s / 5 mins)
    const now = Date.now();
    const lastSentAt = this.debounceCache.get(fingerprint);
    const ttlMs = this.config?.debounceTtlSec
      ? this.config.debounceTtlSec * 1000
      : 300_000;

    if (lastSentAt && now - lastSentAt < ttlMs) {
      const remainingSec = Math.ceil((ttlMs - (now - lastSentAt)) / 1000);
      this.logger.warn(
        `[Debounce Suppressed] Alert [${event.errorCode}] "${event.summary}" suppressed. Cooldown active (${remainingSec}s remaining).`,
      );
      return {
        success: false,
        fingerprint,
        suppressed: true,
        durationMs: Date.now() - startTime,
        recipientsCount: 0,
      };
    }

    // 2. Validate recipients & transport
    let recipients = this.config?.adminEmails || [];
    if (this.prisma) {
      try {
        const activeRows = await this.prisma.emergencyMailingList.findMany({
          where: { isActive: true },
          select: { email: true },
        });
        if (activeRows.length > 0) {
          recipients = Array.from(
            new Set([...recipients, ...activeRows.map((r) => r.email)]),
          );
        }
      } catch (dbErr: unknown) {
        const msg = dbErr instanceof Error ? dbErr.message : String(dbErr);
        this.logger.warn(`[EmergencyAlertService] Dynamic mailing list fallback: ${msg}`);
      }

      if (recipients.length === 0) {
        try {
          const admins = await this.prisma.user.findMany({
            where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, email: { not: null } },
            select: { email: true },
          });
          const adminEmails = admins.map((u) => u.email).filter((e): e is string => Boolean(e));
          if (adminEmails.length > 0) recipients = Array.from(new Set(adminEmails));
        } catch {
          // ignore fallback error
        }
      }
    }
    if (recipients.length === 0) {
      recipients = ['security@trustpassz.io'];
    }

    if (!this.transporter) {
      this.logger.error(
        `[EmergencyAlertService] Alert [${event.errorCode}] failed: Transporter is uninitialized. Verify SMTP configuration.`,
      );
      return {
        success: false,
        fingerprint,
        suppressed: false,
        durationMs: Date.now() - startTime,
        recipientsCount: recipients.length,
        error: 'Transporter uninitialized',
      };
    }

    // 3. Assemble Cyber-Alert Email Payload
    const dateNow = new Date();
    const timestampUtc = dateNow.toISOString();
    const timestampVn = new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      dateStyle: 'full',
      timeStyle: 'long',
    }).format(dateNow);

    const emailData: EmergencyEmailData = {
      service: event.service,
      errorCode: event.errorCode,
      summary: event.summary,
      message: event.message,
      stackTrace: event.stackTrace,
      host: event.host || os.hostname(),
      environment:
        event.environment ||
        this.configService.get<string>('NODE_ENV') ||
        'development',
      timestampUtc,
      timestampVn,
      dashboardUrl: this.config.adminDashboardUrl,
      metadata: event.metadata,
    };

    const subject = `[EMERGENCY - TRUSTPASSZ] ${event.summary}`;
    const htmlBody = renderEmergencyEmailHtml(emailData);
    const textBody =
      `[EMERGENCY - TRUSTPASSZ] ${event.summary}\n\n` +
      `Service: ${event.service}\n` +
      `Error Code: ${event.errorCode}\n` +
      `Severity: CRITICAL\n` +
      `Timestamp: ${timestampUtc} (${timestampVn})\n` +
      `Host: ${emailData.host} (${emailData.environment})\n\n` +
      `Details: ${event.message}\n\n` +
      (event.stackTrace ? `Stack Trace:\n${event.stackTrace}\n\n` : '') +
      `Dashboard: ${this.config.adminDashboardUrl}\n`;

    // 4. Asynchronous Non-blocking Dispatch
    let timerId: NodeJS.Timeout | undefined;
    try {
      const sendPromise = this.transporter.sendMail({
        from: `"${this.config.senderName}" <${this.config.smtpUser}>`,
        to: recipients,
        subject,
        text: textBody,
        html: htmlBody,
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high',
          'X-TrustPassz-Alert': event.errorCode,
        },
      });

      // Guard with timeout to guarantee SLA latency < 3000ms
      const timeoutPromise = new Promise<never>((_, reject) => {
        timerId = setTimeout(
          () => reject(new Error('SMTP dispatch exceeded 3000ms SLA timeout')),
          3000,
        );
      });

      const info = await Promise.race([sendPromise, timeoutPromise]);
      if (timerId) clearTimeout(timerId);
      const durationMs = Date.now() - startTime;

      // Lock debounce on successful dispatch
      this.debounceCache.set(fingerprint, now);

      this.logger.warn(
        `[CRITICAL ALERT DISPATCHED] -> [${recipients.join(', ')}] | Code: ${event.errorCode} | Latency: ${durationMs}ms (SLA < 3000ms) | MessageId: ${info.messageId}`,
      );

      if (this.prisma) {
        try {
          await this.prisma.emergencyDispatchLog.create({
            data: {
              alertType: event.errorCode || 'CRITICAL',
              severity: 'CRITICAL',
              recipients: recipients,
              subject,
              status: 'SENT',
              errorMessage: null,
              latencyMs: durationMs,
              triggeredBy: 'SYSTEM_SENTINEL',
            },
          });
        } catch (dbErr) {
          this.logger.warn(`Failed to record emergency dispatch log: ${dbErr}`);
        }
      }

      return {
        success: true,
        fingerprint,
        suppressed: false,
        durationMs,
        recipientsCount: recipients.length,
        messageId: info.messageId,
      };
    } catch (sendErr: unknown) {
      if (timerId) clearTimeout(timerId);
      const durationMs = Date.now() - startTime;
      const errMsg = sendErr instanceof Error ? sendErr.message : String(sendErr);
      this.logger.error(
        `[EmergencyAlertService] Failed to send emergency email [${event.errorCode}]: ${errMsg} (after ${durationMs}ms)`,
      );

      if (this.prisma) {
        try {
          await this.prisma.emergencyDispatchLog.create({
            data: {
              alertType: event.errorCode || 'CRITICAL',
              severity: 'CRITICAL',
              recipients: recipients,
              subject,
              status: 'FAILED',
              errorMessage: errMsg,
              latencyMs: durationMs,
              triggeredBy: 'SYSTEM_SENTINEL',
            },
          });
        } catch (dbErr) {
          this.logger.warn(`Failed to record failed dispatch log: ${dbErr}`);
        }
      }

      return {
        success: false,
        fingerprint,
        suppressed: false,
        durationMs,
        recipientsCount: recipients.length,
        error: errMsg,
      };
    }
  }

  /**
   * Helper method for test suites and manual admin cache invalidation.
   */
  clearDebounce(fingerprint?: string): void {
    if (fingerprint) {
      this.debounceCache.delete(fingerprint);
    } else {
      this.debounceCache.clear();
    }
  }

  /**
   * Returns remaining TTL in milliseconds for a given fingerprint, or 0 if inactive.
   */
  getDebounceRemainingMs(fingerprint: string): number {
    const lastSent = this.debounceCache.get(fingerprint);
    if (!lastSent) return 0;
    const ttlMs = this.config?.debounceTtlSec
      ? this.config.debounceTtlSec * 1000
      : 300_000;
    const elapsed = Date.now() - lastSent;
    return elapsed < ttlMs ? ttlMs - elapsed : 0;
  }
}
