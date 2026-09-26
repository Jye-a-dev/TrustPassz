import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateBargainDto,
  QueryBargainDto,
  RespondBargainDto,
} from './dto/bargain.dto';
import { BargainStatus, DealState, Prisma } from '@prisma/client';

@Injectable()
export class BargainsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBargainDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product ${dto.productId} not found`);
    }

    if (product.status !== 'ACTIVE') {
      throw new BadRequestException('Product is not active for bargaining');
    }

    if (product.sellerId === dto.buyerId) {
      throw new BadRequestException('Seller cannot bargain on own product');
    }

    const ruleConfig = (product.ruleConfig as any) ?? {};
    if (ruleConfig.allow_bargain === false) {
      throw new BadRequestException('Bargaining is disabled for this product');
    }

    const hours = dto.validHours ?? 24;
    const expiresAt = new Date(Date.now() + hours * 3600 * 1000);

    return this.prisma.bargainOffer.create({
      data: {
        productId: dto.productId,
        buyerId: dto.buyerId,
        offeredPrice: new Prisma.Decimal(dto.offeredPrice),
        status: BargainStatus.PENDING,
        expiresAt,
        negotiationData: (dto.negotiationData as any) ?? {},
      },
      include: {
        product: {
          select: { id: true, title: true, basePrice: true, currency: true },
        },
        buyer: {
          select: { id: true, displayName: true, email: true },
        },
      },
    });
  }

  async findAll(query: QueryBargainDto) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.BargainOfferWhereInput = {
      ...(query.productId && { productId: query.productId }),
      ...(query.buyerId && { buyerId: query.buyerId }),
      ...(query.status && { status: query.status }),
    };

    const [total, data] = await Promise.all([
      this.prisma.bargainOffer.count({ where }),
      this.prisma.bargainOffer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { id: true, title: true, basePrice: true, sellerId: true },
          },
          buyer: {
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
    const bargain = await this.prisma.bargainOffer.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            seller: {
              select: { id: true, displayName: true, email: true },
            },
          },
        },
        buyer: {
          select: { id: true, displayName: true, email: true, walletAddress: true },
        },
      },
    });

    if (!bargain) {
      throw new NotFoundException(`Bargain offer ${id} not found`);
    }

    return bargain;
  }

  async respond(id: string, dto: RespondBargainDto) {
    const bargain = await this.findOne(id);

    if (bargain.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot respond to bargain in status ${bargain.status}`,
      );
    }

    if (new Date() > bargain.expiresAt) {
      await this.prisma.bargainOffer.update({
        where: { id },
        data: { status: BargainStatus.EXPIRED },
      });
      throw new BadRequestException('Bargain offer has expired');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedOffer = await tx.bargainOffer.update({
        where: { id },
        data: {
          status:
            dto.status === 'ACCEPTED'
              ? BargainStatus.ACCEPTED
              : BargainStatus.REJECTED,
          negotiationData: {
            ...((bargain.negotiationData as any) ?? {}),
            responseNote: dto.responseNote,
            respondedAt: new Date().toISOString(),
          },
        },
      });

      let createdDeal: any = null;
      if (dto.status === 'ACCEPTED') {
        createdDeal = await tx.deal.create({
          data: {
            sellerId: bargain.product.sellerId,
            buyerId: bargain.buyerId,
            title: `Bargain Deal: ${bargain.product.title}`,
            amount: bargain.offeredPrice,
            currency: bargain.product.currency,
            state: DealState.PENDING,
          },
        });
      }

      return {
        bargain: updatedOffer,
        deal: createdDeal,
      };
    });
  }
}
