import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditActionType } from '../audit-log/dto/audit-log.dto';
import {
  QueryAdminUsersDto,
  ToggleFreezeUserDto,
  UpdateUserRoleDto,
} from './dto/admin-user.dto';

export interface AdminUserListItem {
  id: string;
  email: string | null;
  phone: string | null;
  walletAddress: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isFrozen: boolean;
  kycStatus: string;
  totalDeals: number;
  totalDisputes: number;
  disputeRate: number;
  walletBalanceSol?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);
  private readonly solanaConnection: Connection;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly configService: ConfigService,
  ) {
    const rpcUrl =
      this.configService.get<string>('SOLANA_RPC_URL') ||
      'https://api.devnet.solana.com';
    this.solanaConnection = new Connection(rpcUrl, 'confirmed');
  }

  /**
   * Safe helper to query real-time Solana wallet balance
   */
  private async getSolanaBalance(walletAddress: string): Promise<number | null> {
    try {
      if (!walletAddress || walletAddress.startsWith('0x') || walletAddress.length < 32) {
        return null;
      }
      const pubkey = new PublicKey(walletAddress);
      const lamports = await this.solanaConnection.getBalance(pubkey);
      return Number((lamports / LAMPORTS_PER_SOL).toFixed(4));
    } catch {
      return null;
    }
  }

  /**
   * Retrieves paginated users list with search by UUID, Email, or Wallet Address.
   */
  async findAll(query: QueryAdminUsersDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const searchTerm = query.search?.trim();
    const where: any = {};

    if (query.role) {
      where.role = query.role;
    }

    if (searchTerm) {
      where.OR = [
        { id: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { displayName: { contains: searchTerm, mode: 'insensitive' } },
        { walletAddress: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              sellerDeals: true,
              buyerDeals: true,
              initiatedDisputes: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const data: AdminUserListItem[] = users.map((u) => {
      const sellerCount = u._count?.sellerDeals || 0;
      const buyerCount = u._count?.buyerDeals || 0;
      const totalDeals = sellerCount + buyerCount;
      const disputeCount = u._count?.initiatedDisputes || 0;
      const disputeRate =
        totalDeals > 0 ? Number(((disputeCount / totalDeals) * 100).toFixed(1)) : 0;

      return {
        id: u.id,
        email: u.email,
        phone: u.phone,
        walletAddress: u.walletAddress,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        role: u.role,
        isFrozen: (u as any).isFrozen ?? false,
        kycStatus: (u as any).kycStatus ?? 'VERIFIED',
        totalDeals,
        totalDisputes: disputeCount,
        disputeRate,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Fetches full profile with live on-chain balance and deal dispute metrics.
   */
  async findOne(id: string): Promise<AdminUserListItem> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            sellerDeals: true,
            buyerDeals: true,
            initiatedDisputes: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const sellerCount = user._count?.sellerDeals || 0;
    const buyerCount = user._count?.buyerDeals || 0;
    const totalDeals = sellerCount + buyerCount;
    const disputeCount = user._count?.initiatedDisputes || 0;
    const disputeRate =
      totalDeals > 0 ? Number(((disputeCount / totalDeals) * 100).toFixed(1)) : 0;

    let walletBalanceSol: number | null = null;
    if (user.walletAddress) {
      walletBalanceSol = await this.getSolanaBalance(user.walletAddress);
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      walletAddress: user.walletAddress,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isFrozen: (user as any).isFrozen ?? false,
      kycStatus: (user as any).kycStatus ?? 'VERIFIED',
      totalDeals,
      totalDisputes: disputeCount,
      disputeRate,
      walletBalanceSol,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Updates user role with atomic AuditLog recording.
   */
  async updateRole(id: string, dto: UpdateUserRoleDto, adminId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    const previousRole = user.role;
    if (previousRole === dto.role) {
      throw new BadRequestException(`User already has role ${dto.role}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data: { role: dto.role },
      });

      await this.auditLogService.record({
        adminId,
        actionType: AuditActionType.ROLE_CHANGE,
        targetEntityId: id,
        payloadBefore: { role: previousRole },
        payloadAfter: { role: dto.role },
        auditReason: dto.auditReason,
      });

      return updated;
    });
  }

  /**
   * Freezes or unfreezes user wallet with atomic AuditLog recording.
   */
  async toggleFreeze(id: string, dto: ToggleFreezeUserDto, adminId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    const currentFrozen = (user as any).isFrozen ?? false;

    return this.prisma.$transaction(async (tx) => {
      try {
        await tx.$executeRaw`
          UPDATE users 
          SET is_frozen = ${dto.isFrozen}, updated_at = NOW() 
          WHERE id = ${id}::uuid
        `;
      } catch {
        await (tx.user as any).update({
          where: { id },
          data: { isFrozen: dto.isFrozen },
        });
      }

      await this.auditLogService.record({
        adminId,
        actionType: dto.isFrozen
          ? AuditActionType.FREEZE_USER
          : AuditActionType.UNFREEZE_USER,
        targetEntityId: id,
        payloadBefore: { isFrozen: currentFrozen, walletAddress: user.walletAddress },
        payloadAfter: { isFrozen: dto.isFrozen, walletAddress: user.walletAddress },
        auditReason: dto.auditReason,
      });

      return {
        id,
        walletAddress: user.walletAddress,
        isFrozen: dto.isFrozen,
        updatedAt: new Date(),
      };
    });
  }
}

