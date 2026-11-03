import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  AuditActionType,
  CreateAuditLogDto,
  QueryAuditLogDto,
} from './dto/audit-log.dto';

export interface AuditLogRecord {
  id: string;
  adminId: string | null;
  actionType: AuditActionType;
  targetEntityId: string;
  payloadBefore: Record<string, unknown> | null;
  payloadAfter: Record<string, unknown> | null;
  auditReason: string;
  txHash: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  admin?: {
    id: string;
    email: string | null;
    displayName: string | null;
    role: string;
  } | null;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records an audit log entry atomically with dual Prisma ORM / SQL fallback.
   */
  async record(dto: CreateAuditLogDto): Promise<AuditLogRecord> {
    const payloadBeforeJson = dto.payloadBefore
      ? JSON.stringify(dto.payloadBefore)
      : null;
    const payloadAfterJson = dto.payloadAfter
      ? JSON.stringify(dto.payloadAfter)
      : null;

    try {
      if ((this.prisma as any).auditLog?.create) {
        const created = await (this.prisma as any).auditLog.create({
          data: {
            adminId: dto.adminId || null,
            actionType: dto.actionType,
            targetEntityId: dto.targetEntityId,
            payloadBefore: dto.payloadBefore || undefined,
            payloadAfter: dto.payloadAfter || undefined,
            auditReason: dto.auditReason,
            txHash: dto.txHash || null,
            ipAddress: dto.ipAddress || null,
            userAgent: dto.userAgent || null,
          },
          include: {
            admin: {
              select: { id: true, email: true, displayName: true, role: true },
            },
          },
        });
        return created as AuditLogRecord;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Prisma model auditLog fallback to raw query: ${msg}`);
    }

    // Direct PostgreSQL Raw Query Fallback
    const rows = await this.prisma.$queryRaw<Array<AuditLogRecord>>`
      INSERT INTO audit_logs (
        id, admin_id, action_type, target_entity_id, payload_before, payload_after, audit_reason, tx_hash, ip_address, user_agent, created_at
      ) VALUES (
        uuid_generate_v4(), 
        ${dto.adminId ? (dto.adminId as any) : null}::uuid, 
        ${dto.actionType}::audit_action_type_enum, 
        ${dto.targetEntityId}, 
        ${payloadBeforeJson}::jsonb, 
        ${payloadAfterJson}::jsonb, 
        ${dto.auditReason}, 
        ${dto.txHash || null}, 
        ${dto.ipAddress || null}, 
        ${dto.userAgent || null}, 
        NOW()
      )
      RETURNING 
        id, 
        admin_id as "adminId", 
        action_type as "actionType", 
        target_entity_id as "targetEntityId", 
        payload_before as "payloadBefore", 
        payload_after as "payloadAfter", 
        audit_reason as "auditReason", 
        tx_hash as "txHash", 
        ip_address as "ipAddress", 
        user_agent as "userAgent", 
        created_at as "createdAt"
    `;

    return rows[0];
  }

  /**
   * Queries paginated audit logs with search filters.
   */
  async findAll(query: QueryAuditLogDto): Promise<{
    data: AuditLogRecord[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    try {
      if ((this.prisma as any).auditLog?.findMany) {
        const where: Record<string, unknown> = {};
        if (query.actionType) where.actionType = query.actionType;
        if (query.adminId) where.adminId = query.adminId;
        if (query.targetEntityId) where.targetEntityId = query.targetEntityId;

        const [items, total] = await Promise.all([
          (this.prisma as any).auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            include: {
              admin: {
                select: {
                  id: true,
                  email: true,
                  displayName: true,
                  role: true,
                },
              },
            },
          }),
          (this.prisma as any).auditLog.count({ where }),
        ]);

        return {
          data: items as AuditLogRecord[],
          meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`auditLog.findMany fallback: ${msg}`);
    }

    // Raw SQL query fallback
    const items = await this.prisma.$queryRaw<Array<AuditLogRecord>>`
      SELECT 
        a.id,
        a.admin_id as "adminId",
        a.action_type as "actionType",
        a.target_entity_id as "targetEntityId",
        a.payload_before as "payloadBefore",
        a.payload_after as "payloadAfter",
        a.audit_reason as "auditReason",
        a.tx_hash as "txHash",
        a.ip_address as "ipAddress",
        a.user_agent as "userAgent",
        a.created_at as "createdAt",
        json_build_object(
          'id', u.id,
          'email', u.email,
          'displayName', u.display_name,
          'role', u.role
        ) as admin
      FROM audit_logs a
      LEFT JOIN users u ON a.admin_id = u.id
      WHERE (
        (${query.actionType || null}::text IS NULL OR a.action_type::text = ${query.actionType || null})
        AND (${query.adminId || null}::uuid IS NULL OR a.admin_id = ${query.adminId || null}::uuid)
        AND (${query.targetEntityId || null}::text IS NULL OR a.target_entity_id = ${query.targetEntityId || null})
      )
      ORDER BY a.created_at DESC
      LIMIT ${limit} OFFSET ${skip}
    `;

    const countResult = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint as count
      FROM audit_logs a
      WHERE (
        (${query.actionType || null}::text IS NULL OR a.action_type::text = ${query.actionType || null})
        AND (${query.adminId || null}::uuid IS NULL OR a.admin_id = ${query.adminId || null}::uuid)
        AND (${query.targetEntityId || null}::text IS NULL OR a.target_entity_id = ${query.targetEntityId || null})
      )
    `;

    const total = Number(countResult[0]?.count || 0);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

