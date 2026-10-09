import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import axios from 'axios';
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
  private readonly logger = new Logger(DisputesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resilient caller for AI Arbitration microservice (/api/v1/inspect).
   * Safe Fallback: executes exponential backoff retry; falls back safely to
   * ESCALATE_TO_ADMIN on connection failure, timeout, or server error.
   */
  private async callAiArbitratorSafely(
    dealId: string,
    title: string,
    reason: string,
  ): Promise<{
    verdict: ArbitrationVerdict;
    confidenceScore: Prisma.Decimal;
    explanation: string;
  }> {
    const aiBase = (
      process.env.AI_PIPELINE_URL || 'http://127.0.0.1:3100'
    ).replace(/\/+$/, '');
    const inspectUrl = `${aiBase}/api/v1/inspect`;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await axios.post(
          inspectUrl,
          {
            deal_id: dealId,
            title: title || 'Deal Escrow Dispute',
            description: reason,
            inspection_criteria: ['Standard digital asset verification'],
            seller_evidence: 'Digital asset packaged in vault',
            buyer_complaint: reason,
          },
          {
            timeout: 5000,
            validateStatus: () => true,
          },
        );

        if (response.status === 200 && response.data) {
          const action = response.data.action;
          let mappedVerdict: ArbitrationVerdict =
            ArbitrationVerdict.ESCALATE_TO_ADMIN;

          if (action === 'APPROVE_PAYOUT') {
            mappedVerdict = ArbitrationVerdict.APPROVE_PAYOUT;
          } else if (action === 'TRIGGER_REFUND') {
            mappedVerdict = ArbitrationVerdict.TRIGGER_REFUND;
          }

          const score = Number(response.data.confidence_score) || 0.85;
          return {
            verdict: mappedVerdict,
            confidenceScore: new Prisma.Decimal(score.toFixed(4)),
            explanation:
              response.data.reasoning_summary ||
              'AI inspection successfully completed.',
          };
        }

        this.logger.warn(
          `[DisputesService] AI pipeline HTTP ${response.status} (attempt ${attempt}/2)`,
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `[DisputesService] AI probe error on attempt ${attempt}: ${msg}`,
        );
      }

      if (attempt < 2) {
        await new Promise((res) => setTimeout(res, 500 * attempt));
      }
    }

    this.logger.warn(
      `[DisputesService] AI pipeline unavailable. Safe fallback active -> ESCALATE_TO_ADMIN.`,
    );
    return {
      verdict: ArbitrationVerdict.ESCALATE_TO_ADMIN,
      confidenceScore: new Prisma.Decimal('0.7500'),
      explanation:
        'Safe fallback: AI arbitration service temporarily unreachable. Escalated to human administrator.',
    };
  }

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

    const aiResult = await this.callAiArbitratorSafely(
      dto.dealId,
      deal.title,
      dto.reason,
    );

    return this.prisma.$transaction(async (tx) => {
      // Transition deal to DISPUTED
      await tx.deal.update({
        where: { id: dto.dealId },
        data: { state: DealState.DISPUTED },
      });

      return tx.disputeLog.create({
        data: {
          dealId: dto.dealId,
          initiatorId: dto.initiatorId,
          status: DisputeStatus.AI_PROCESSING,
          reason: dto.reason,
          evidenceUrls: (dto.evidenceUrls as string[]) ?? [],
          aiVerdict: aiResult.verdict,
          aiConfidenceScore: aiResult.confidenceScore,
          aiExplanation: aiResult.explanation,
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
