import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DealState, DigitalAsset, Prisma } from '@prisma/client';
import '../../common/utils/bigint-serializer.util';
import { PrismaService } from '../../database/prisma.service';
import {
  buildCountBreakdown,
  buildDealCreateData,
  buildDealUpdateData,
  buildDealWhereInput,
  buildDigitalAssetCreateData,
  buildDigitalAssetUpsertInput,
  DEAL_DETAIL_INCLUDE,
  DEAL_LIST_INCLUDE,
} from './deals.helper';
import { CreateDealDto } from './dto/create-deal.dto';
import { QueryDealDto } from './dto/query-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';

@Injectable()
export class DealsService {
  private readonly logger = new Logger(DealsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Aggregates total deals and breakdown by state with optional seller/buyer filters.
   */
  async countDeals(sellerId?: string, buyerId?: string) {
    const where: Prisma.DealWhereInput = {
      ...(sellerId ? { sellerId } : {}),
      ...(buyerId ? { buyerId } : {}),
    };

    try {
      const [total, grouped] = await Promise.all([
        this.prisma.deal.count({ where }),
        this.prisma.deal.groupBy({
          by: ['state'],
          where,
          _count: { id: true },
        }),
      ]);

      return {
        total,
        breakdown: buildCountBreakdown(grouped),
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to aggregate deal counts: ${message}`, stack);
      throw new InternalServerErrorException('Failed to calculate deal counts');
    }
  }

  /**
   * Creates a new deal and associates an encrypted digital vault asset in an ACID transaction.
   */
  async create(createDealDto: CreateDealDto) {
    const { digitalAsset, ...dealData } = createDealDto;

    const seller = await this.prisma.user.findUnique({
      where: { id: dealData.sellerId },
    });
    if (!seller) {
      throw new NotFoundException(
        `Seller user with ID ${dealData.sellerId} not found`,
      );
    }

    if (dealData.buyerId) {
      const buyer = await this.prisma.user.findUnique({
        where: { id: dealData.buyerId },
      });
      if (!buyer) {
        throw new NotFoundException(
          `Buyer user with ID ${dealData.buyerId} not found`,
        );
      }
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const deal = await tx.deal.create({
          data: buildDealCreateData(dealData),
        });

        let createdAsset: DigitalAsset | null = null;
        if (digitalAsset) {
          createdAsset = await tx.digitalAsset.create({
            data: buildDigitalAssetCreateData(deal.id, digitalAsset),
          });
        }

        return {
          ...deal,
          digitalAsset: createdAsset,
        };
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to create deal: ${message}`, stack);
      throw new InternalServerErrorException(
        'Failed to create deal and digital asset',
      );
    }
  }

  /**
   * Retrieves paginated list of deals with filtering and full-text search capability.
   */
  async findAll(query: QueryDealDto) {
    const page = query.page && query.page > 0 ? Number(query.page) : 1;
    const limit = query.limit && query.limit > 0 ? Number(query.limit) : 10;
    const skip = (page - 1) * limit;
    const where = buildDealWhereInput(query);

    try {
      const [deals, total] = await Promise.all([
        this.prisma.deal.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: DEAL_LIST_INCLUDE,
        }),
        this.prisma.deal.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit) || 1;

      return {
        data: deals,
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to fetch deals: ${message}`, stack);
      throw new InternalServerErrorException('Failed to retrieve deals');
    }
  }

  /**
   * Retrieves single deal details with relations (seller, buyer, digitalAsset, disputeLogs).
   */
  async findOne(id: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: DEAL_DETAIL_INCLUDE,
    });

    if (!deal) {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }

    return deal;
  }

  /**
   * Partially updates a deal and optionally upserts its associated digital vault asset.
   * Blocks updates if deal is in terminal states (SETTLED or REFUNDED).
   */
  async update(id: string, updateDealDto: UpdateDealDto) {
    const existingDeal = await this.prisma.deal.findUnique({
      where: { id },
      include: { digitalAsset: true },
    });

    if (!existingDeal) {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }

    if (
      existingDeal.state === DealState.SETTLED ||
      existingDeal.state === DealState.REFUNDED
    ) {
      throw new BadRequestException(
        `Cannot update deal: deal is in terminal state (${existingDeal.state})`,
      );
    }

    const { digitalAsset, ...dealUpdates } = updateDealDto;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const updatedDeal = await tx.deal.update({
          where: { id },
          data: buildDealUpdateData(dealUpdates),
          include: DEAL_LIST_INCLUDE,
        });

        if (digitalAsset) {
          const upsertPayload = buildDigitalAssetUpsertInput(id, digitalAsset);
          const upsertedAsset = await tx.digitalAsset.upsert({
            where: upsertPayload.where,
            create: upsertPayload.create,
            update: upsertPayload.update,
          });

          return {
            ...updatedDeal,
            digitalAsset: upsertedAsset,
          };
        }

        return updatedDeal;
      });
    } catch (error: unknown) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to update deal ${id}: ${message}`, stack);
      throw new InternalServerErrorException('Failed to update deal');
    }
  }

  /**
   * Deletes a deal only if it is in PENDING state.
   * Rejects deletion if deal has progressed to DEPOSITED or subsequent escrow states.
   */
  async remove(id: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
    });

    if (!deal) {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }

    if (deal.state !== DealState.PENDING) {
      throw new BadRequestException(
        `Cannot delete deal: only deals in PENDING state can be deleted (current state: ${deal.state})`,
      );
    }

    try {
      await this.prisma.deal.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Deal deleted successfully',
        id,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to delete deal ${id}: ${message}`, stack);
      throw new InternalServerErrorException('Failed to delete deal');
    }
  }

  /**
   * Unlocks digital asset from vault, auditing decryption attempts and enforcing access quota.
   */
  async unlockVault(id: string, buyerId?: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: { digitalAsset: true },
    });

    if (!deal) {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }

    if (!deal.digitalAsset) {
      throw new NotFoundException(`No digital asset attached to deal ${id}`);
    }

    if (
      deal.state === DealState.PENDING ||
      deal.state === DealState.REFUNDED
    ) {
      throw new BadRequestException(
        `Cannot unlock vault for deal in ${deal.state} state. Escrow deposit required.`,
      );
    }

    const asset = deal.digitalAsset;
    if (asset.accessCount >= asset.maxAccessLimit) {
      throw new BadRequestException(
        `Digital Vault access limit reached (${asset.accessCount}/${asset.maxAccessLimit}). Vault locked.`,
      );
    }

    const updatedAsset = await this.prisma.digitalAsset.update({
      where: { id: asset.id },
      data: {
        accessCount: { increment: 1 },
        unlockedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Digital vault asset unlocked successfully',
      dealId: id,
      assetType: updatedAsset.assetType,
      fileName: updatedAsset.fileName,
      fileSizeBytes: updatedAsset.fileSizeBytes,
      encryptedContent: updatedAsset.encryptedContent,
      encryptionIv: updatedAsset.encryptionIv,
      authTag: updatedAsset.authTag,
      contentHash: updatedAsset.contentHash,
      accessCount: updatedAsset.accessCount,
      maxAccessLimit: updatedAsset.maxAccessLimit,
      unlockedAt: updatedAsset.unlockedAt,
    };
  }
}

