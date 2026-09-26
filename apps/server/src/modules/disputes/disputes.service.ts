import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  OpenDisputeDto,
  QueryDisputeDto,
  ResolveDisputeDto,
} from './dto/dispute.dto';
import {
  ArbitrationVerdict,
  DealState,
  DisputeStatus,
  Prisma,
} from '@prisma/client';

@Injectable()
export class DisputesService {
  constructor(private readonly prisma: PrismaService) {}

  async openDispute(dto: OpenDisputeDto) {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dto.dealId },
    });

    if (!deal) {
      throw new NotFoundException(`Deal ${dto.dealId} not found`);
    }

    if (deal.state === DealState.SETTLED || deal.state === DealState.REFUNDED) {
      throw new BadRequestException(
        `Cannot open dispute on deal in terminal state ${deal.state}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Transition deal to DISPUTED
      await tx.deal.update({
        where: { id: dto.dealId },
        data: { state: DealState.DISPUTED },
      });

      // AI Arbitration mock analysis engine
      const aiVerdict = ArbitrationVerdict.ESCALATE_TO_ADMIN;
      const aiConfidenceScore = new Prisma.Decimal('0.8500');
      const aiExplanation =
        'AI Arbitration engine evaluated submitted evidence claims against contract specifications. Automated decision escalated to arbitrator due to non-standard asset format.';

      return tx.disputeLog.create({
        data: {
          dealId: dto.dealId,
          initiatorId: dto.initiatorId,
          status: DisputeStatus.AI_PROCESSING,
          reason: dto.reason,
          evidenceUrls: (dto.evidenceUrls as any) ?? [],
          aiVerdict,
          aiConfidenceScore,
          aiExplanation,
          aiAnalyzedAt: new Date(),
        },
        include: {
          deal: {
            select: { id: true, title: true, state: true, amount: true },
          },
          initiator: {
            select: { id: true, displayName: true, email: true },
          },
        },
      });
    });
  }

  async findAll(query: QueryDisputeDto) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.DisputeLogWhereInput = {
      ...(query.dealId && { dealId: query.dealId }),
      ...(query.status && { status: query.status }),
    };

    const [total, data] = await Promise.all([
      this.prisma.disputeLog.count({ where }),
      this.prisma.disputeLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          deal: {
            select: { id: true, title: true, state: true, amount: true },
          },
          initiator: {
            select: { id: true, displayName: true },
          },
          resolvedBy: {
            select: { id: true, displayName: true },
          },
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string) {
    const dispute = await this.prisma.disputeLog.findUnique({
      where: { id },
      include: {
        deal: {
          include: {
            seller: { select: { id: true, displayName: true, email: true } },
            buyer: { select: { id: true, displayName: true, email: true } },
            digitalAsset: true,
          },
        },
        initiator: {
          select: { id: true, displayName: true, email: true },
        },
        resolvedBy: {
          select: { id: true, displayName: true, role: true },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException(`Dispute log ${id} not found`);
    }

    return dispute;
  }

  async escalate(id: string) {
    const dispute = await this.findOne(id);

    if (dispute.status === DisputeStatus.CLOSED) {
      throw new BadRequestException('Cannot escalate closed dispute');
    }

    return this.prisma.disputeLog.update({
      where: { id },
      data: { status: DisputeStatus.ADMIN_ESCALATED },
    });
  }

  async resolve(id: string, dto: ResolveDisputeDto) {
    const dispute = await this.findOne(id);

    if (dispute.status === DisputeStatus.CLOSED) {
      throw new BadRequestException('Dispute is already resolved and closed');
    }

    return this.prisma.$transaction(async (tx) => {
      let finalDealState: DealState | undefined;

      if (dto.adminVerdict === ArbitrationVerdict.APPROVE_PAYOUT) {
        finalDealState = DealState.SETTLED;
      } else if (dto.adminVerdict === ArbitrationVerdict.TRIGGER_REFUND) {
        finalDealState = DealState.REFUNDED;
      }

      if (finalDealState) {
        await tx.deal.update({
          where: { id: dispute.dealId },
          data: { state: finalDealState },
        });
      }

      return tx.disputeLog.update({
        where: { id },
        data: {
          status: DisputeStatus.CLOSED,
          adminVerdict: dto.adminVerdict,
          resolvedById: dto.resolvedById,
          resolutionNote: dto.resolutionNote,
          resolvedAt: new Date(),
        },
        include: {
          deal: true,
          resolvedBy: {
            select: { id: true, displayName: true, role: true },
          },
        },
      });
    });
  }
}
