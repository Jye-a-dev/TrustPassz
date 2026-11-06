import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { RequestUser } from '../../common/decorators/current-user.decorator';
import { EmergencyAlertService } from './emergency-alert.service';
import {
  CreateEmergencyEmailDto,
  QueryEmergencyLogsDto,
  TestSendAlertDto,
  UpdateEmergencyEmailDto,
} from './dto/emergency-mailing-list.dto';
import { renderTestEmailHtml } from './templates/test-email.template';

export interface TestSendResult {
  success: boolean;
  latencyMs: number;
  recipients: string[];
  messageId?: string;
  status: 'SENT' | 'FAILED';
  error?: string;
  logId?: string;
}

@Injectable()
export class EmergencyAlertAdminService {
  private readonly logger = new Logger(EmergencyAlertAdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly alertService: EmergencyAlertService,
  ) {}

  /**
   * Verify 6-digit 2FA PIN for Super Admin sensitive actions.
   */
  public verify2FaPin(pin: string): void {
    const configuredPin =
      this.configService.get<string>('ADMIN_2FA_PIN')?.trim() || '888999';

    if (!pin || pin.trim() !== configuredPin) {
      throw new ForbiddenException(
        'Mã PIN 2FA xác thực cấp 2 không chính xác hoặc đã hết hiệu lực',
      );
    }
  }

  /**
   * Retrieve all emergency recipient emails from DB.
   */
  async getMailingList() {
    const list = await this.prisma.emergencyMailingList.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // If database list is currently empty, include environment fallback emails as unpersisted hints
    if (list.length === 0) {
      const fallbackEmails = this.alertService.getConfigAdminEmails();
      return fallbackEmails.map((email) => ({
        id: `env-${Buffer.from(email).toString('hex').slice(0, 8)}`,
        email,
        label: 'System Config (.env fallback)',
        isActive: true,
        addedBy: 'SYSTEM_BOOTSTRAP',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    }

    return list;
  }

  /**
   * Register a new emergency recipient email. Requires 2FA PIN.
   */
  async addEmail(dto: CreateEmergencyEmailDto, adminUser: RequestUser) {
    this.verify2FaPin(dto.pin2FA);

    const normalizedEmail = dto.email.toLowerCase().trim();
    const existing = await this.prisma.emergencyMailingList.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictException(
        `Email "${normalizedEmail}" đã tồn tại trong danh sách nhận cảnh báo khẩn cấp`,
      );
    }

    const addedBy =
      adminUser?.email ||
      adminUser?.walletAddress ||
      adminUser?.id ||
      'SUPER_ADMIN';

    const record = await this.prisma.emergencyMailingList.create({
      data: {
        email: normalizedEmail,
        label: dto.label.trim(),
        isActive: true,
        addedBy,
      },
    });

    this.logger.log(
      `[EmergencyMailingList] Added "${record.email}" (${record.label}) by ${addedBy}`,
    );

    return record;
  }

  /**
   * Update emergency recipient label or active state. Requires 2FA PIN.
   */
  async updateEmail(
    id: string,
    dto: UpdateEmergencyEmailDto,
    adminUser: RequestUser,
  ) {
    this.verify2FaPin(dto.pin2FA);

    const existing = await this.prisma.emergencyMailingList.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(
        'Không tìm thấy bản ghi email nhận cảnh báo khẩn cấp',
      );
    }

    const updated = await this.prisma.emergencyMailingList.update({
      where: { id },
      data: {
        ...(dto.label !== undefined ? { label: dto.label.trim() } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });

    const actor = adminUser?.email || adminUser?.id || 'SUPER_ADMIN';
    this.logger.log(
      `[EmergencyMailingList] Updated "${updated.email}" by ${actor}`,
    );

    return updated;
  }

  /**
   * Delete an emergency recipient email. Requires 2FA PIN.
   */
  async deleteEmail(id: string, pin2FA: string) {
    this.verify2FaPin(pin2FA);

    const existing = await this.prisma.emergencyMailingList.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(
        'Không tìm thấy email nhận cảnh báo cần xóa trong cơ sở dữ liệu',
      );
    }

    await this.prisma.emergencyMailingList.delete({
      where: { id },
    });

    this.logger.warn(
      `[EmergencyMailingList] Deleted email "${existing.email}" (id: ${id})`,
    );

    return {
      success: true,
      message: `Đã xóa email ${existing.email} khỏi danh sách cứu hộ`,
      id,
    };
  }

  /**
   * Benchmark and test immediate dispatch over Nodemailer / Google Workspace SMTP.
   * Enforces < 2000ms SLA response limit and persists audit record into DB.
   */
  async testSendEmergencyAlert(
    dto: TestSendAlertDto,
    adminUser?: RequestUser,
  ): Promise<TestSendResult> {
    const startTime = Date.now();
    const actor = adminUser?.email || adminUser?.id || 'SUPER_ADMIN';

    // 1. Resolve recipients list
    let recipients: string[] = [];
    if (dto.targetEmail) {
      recipients = [dto.targetEmail.toLowerCase().trim()];
    } else {
      const activeRows = await this.prisma.emergencyMailingList.findMany({
        where: { isActive: true },
        select: { email: true },
      });
      recipients = activeRows.map((r) => r.email);

      // Fallback to config admin emails if DB list has no active records
      if (recipients.length === 0) {
        recipients = this.alertService.getConfigAdminEmails();
      }
    }

    if (recipients.length === 0) {
      throw new BadRequestException(
        'Không tìm thấy email nhận cảnh báo nào khả dụng để thực hiện kiểm tra',
      );
    }

    const subject = `[TEST - EMERGENCY CONNECTION] TrustPassz Sentinel Health Check`;
    const transporter = this.alertService.getTransporter();

    // 2. Validate transporter availability
    if (!transporter) {
      const durationMs = Date.now() - startTime;
      const errMsg = 'SMTP Connection Pool uninitialized or misconfigured.';

      const failedLog = await this.prisma.emergencyDispatchLog.create({
        data: {
          alertType: 'TEST',
          severity: 'INFO',
          recipients: recipients,
          subject,
          status: 'FAILED',
          errorMessage: errMsg,
          latencyMs: durationMs,
          triggeredBy: actor,
        },
      });

      return {
        success: false,
        latencyMs: durationMs,
        recipients,
        status: 'FAILED',
        error: errMsg,
        logId: failedLog.id,
      };
    }

    // 3. Render Cyber-Alert Test HTML
    const formattedDate = new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      dateStyle: 'full',
      timeStyle: 'long',
    }).format(new Date());

    const testHtml = renderTestEmailHtml({
      actor,
      formattedDate,
      customMessage: dto.customMessage,
    });

    // 4. Dispatch with strict 1900ms SLA timeout
    let timerId: NodeJS.Timeout | undefined;
    try {
      const config = this.alertService.getConfig();
      const sendPromise = transporter.sendMail({
        from: `"${config.senderName}" <${config.smtpUser}>`,
        to: recipients,
        subject,
        html: testHtml,
        headers: {
          'X-Priority': '1',
          'X-TrustPassz-Alert': 'TEST_CONNECTION',
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) => {
        timerId = setTimeout(() => {
          reject(new Error('SLA Timeout: SMTP dispatch exceeded 2000ms limit'));
        }, 1900);
      });

      const info = await Promise.race([sendPromise, timeoutPromise]);
      if (timerId) clearTimeout(timerId);

      const latencyMs = Date.now() - startTime;

      const log = await this.prisma.emergencyDispatchLog.create({
        data: {
          alertType: 'TEST',
          severity: 'INFO',
          recipients: recipients,
          subject,
          status: 'SENT',
          errorMessage: null,
          latencyMs,
          triggeredBy: actor,
        },
      });

      this.logger.log(
        `[TestAlert] Dispatched to ${recipients.length} recipients in ${latencyMs}ms (Log ID: ${log.id})`,
      );

      return {
        success: true,
        latencyMs,
        recipients,
        messageId: info.messageId,
        status: 'SENT',
        logId: log.id,
      };
    } catch (err: unknown) {
      if (timerId) clearTimeout(timerId);
      const latencyMs = Date.now() - startTime;
      const errMsg = err instanceof Error ? err.message : String(err);

      const log = await this.prisma.emergencyDispatchLog.create({
        data: {
          alertType: 'TEST',
          severity: 'INFO',
          recipients: recipients,
          subject,
          status: 'FAILED',
          errorMessage: errMsg,
          latencyMs,
          triggeredBy: actor,
        },
      });

      this.logger.error(
        `[TestAlert] Failed dispatch to ${recipients.join(', ')} after ${latencyMs}ms: ${errMsg}`,
      );

      return {
        success: false,
        latencyMs,
        recipients,
        status: 'FAILED',
        error: errMsg,
        logId: log.id,
      };
    }
  }

  /**
   * Retrieve paginated Emergency Dispatch Audit Logs.
   */
  async getDispatchLogs(query: QueryEmergencyLogsDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (query.status) {
      where.status = query.status.toUpperCase();
    }
    if (query.alertType) {
      where.alertType = {
        contains: query.alertType.toUpperCase(),
        mode: 'insensitive',
      };
    }

    const [total, data] = await Promise.all([
      this.prisma.emergencyDispatchLog.count({ where }),
      this.prisma.emergencyDispatchLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      success: true,
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
