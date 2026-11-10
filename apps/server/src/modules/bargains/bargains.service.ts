import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { BargainStatus, DealState, Prisma } from '@prisma/client';
import { RequestUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../database/prisma.service';
import { SupabaseService } from '../../integrations/supabase/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  findDealForBargain,
  resolveOrProvisionDealProduct,
} from './bargains-deal.helper';
import {
  CreateBargainDto,
  QueryBargainDto,
  RespondBargainDto,
} from './dto/bargain.dto';

@Injectable()
export class BargainsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly supabaseService?: SupabaseService,
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {}

  async create(dto: CreateBargainDto) {
    let effectiveProductId = dto.productId;
    const requestedDealId = dto.dealId?.trim();
    const deal = requestedDealId
      ? await this.prisma.deal.findUnique({
          where: { id: requestedDealId },
          include: { order: true },
        })
      : null;

    if (!effectiveProductId && deal) {
      effectiveProductId = await resolveOrProvisionDealProduct(
        this.prisma,
        deal,
        dto.buyerId,
      );
    }

    if (!effectiveProductId) {
      throw new BadRequestException(
        'Phải cung cấp productId hoặc dealId hợp lệ.',
      );
    }

    const product = await this.prisma.product.findUnique({
      where: { id: effectiveProductId },
    });
    if (!product) {
      throw new NotFoundException(`Product ${effectiveProductId} not found`);
    }
    if (product.status !== 'ACTIVE') {
      throw new BadRequestException('Product is not active for bargaining');
    }
    if (product.sellerId === dto.buyerId) {
      throw new ForbiddenException(
        'Bạn không thể tự mua sản phẩm của chính mình.',
      );
    }

    const ruleConfig =
      (product.ruleConfig as Record<string, unknown> | null) ?? {};
    if (ruleConfig.allow_bargain === false) {
      throw new BadRequestException('Bargaining is disabled for this product');
    }

    const hours = dto.validHours ?? 24;
    const expiresAt = new Date(Date.now() + hours * 3600 * 1000);
    const mergedNegotiationData: Record<string, unknown> = {
      ...((dto.negotiationData as Record<string, unknown>) ?? {}),
      ...(deal?.id ? { dealId: deal.id } : {}),
    };

    const offer = await this.prisma.bargainOffer.create({
      data: {
        productId: effectiveProductId,
        buyerId: dto.buyerId,
        offeredPrice: new Prisma.Decimal(dto.offeredPrice),
        status: BargainStatus.PENDING,
        expiresAt,
        negotiationData: mergedNegotiationData as Prisma.InputJsonValue,
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

    // Chốt chặn xác thực: chỉ gửi push deep-link /deal-room khi Deal thực sự tồn tại.
    if (deal?.id) {
      this.notificationsService?.notifyOfferUpdated(product.sellerId, {
        dealId: deal.id,
        dealTitle: product.title,
        price: dto.offeredPrice,
        currency: product.currency,
        proposedBy: dto.buyerId,
      });
    }

    return offer;
  }

  async findAll(query: QueryBargainDto) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    let targetProductId = query.productId;
    if (!targetProductId && query.dealId) {
      const deal = await this.prisma.deal.findUnique({
        where: { id: query.dealId },
        include: { order: true },
      });
      if (deal?.order?.productId) {
        targetProductId = deal.order.productId;
      }
    }

    const where: Prisma.BargainOfferWhereInput = {
      ...(targetProductId && { productId: targetProductId }),
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
          buyer: { select: { id: true, displayName: true } },
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
            seller: { select: { id: true, displayName: true, email: true } },
          },
        },
        buyer: {
          select: {
            id: true,
            displayName: true,
            email: true,
            walletAddress: true,
          },
        },
      },
    });
    if (!bargain) {
      throw new NotFoundException(`Bargain offer ${id} not found`);
    }
    return bargain;
  }

  private async validateSellerPendingOffer(
    id: string,
    actionLabel: 'chấp thuận' | 'từ chối',
    currentUser?: RequestUser,
  ) {
    const bargain = await this.findOne(id);
    if (currentUser && currentUser.id !== bargain.product.sellerId) {
      throw new ForbiddenException(
        `Chỉ người bán của sản phẩm mới có quyền ${actionLabel} đề xuất trả giá.`,
      );
    }
    if (bargain.status !== 'PENDING') {
      throw new BadRequestException(
        `Không thể ${actionLabel} đề xuất ở trạng thái ${bargain.status}`,
      );
    }
    return bargain;
  }

  async acceptOffer(id: string, currentUser?: RequestUser) {
    const bargain = await this.validateSellerPendingOffer(
      id,
      'chấp thuận',
      currentUser,
    );

    if (new Date() > bargain.expiresAt) {
      await this.prisma.bargainOffer.update({
        where: { id },
        data: { status: BargainStatus.EXPIRED },
      });
      throw new BadRequestException('Đề xuất trả giá đã hết hạn.');
    }

    const { updatedOffer, targetDeal } = await this.prisma.$transaction(
      async (tx) => {
        const accepted = await tx.bargainOffer.update({
          where: { id },
          data: {
            status: BargainStatus.ACCEPTED,
            negotiationData: {
              ...((bargain.negotiationData as Record<string, unknown>) ?? {}),
              respondedAt: new Date().toISOString(),
            },
          },
        });

        await tx.bargainOffer.updateMany({
          where: {
            productId: bargain.productId,
            id: { not: id },
            status: BargainStatus.PENDING,
          },
          data: { status: BargainStatus.REJECTED },
        });

        const existingDeal = await findDealForBargain(tx, bargain);
        const deal = existingDeal
          ? await tx.deal.update({
              where: { id: existingDeal.id },
              data: { amount: bargain.offeredPrice },
            })
          : await tx.deal.create({
              data: {
                sellerId: bargain.product.sellerId,
                buyerId: bargain.buyerId,
                title: `Bargain Deal: ${bargain.product.title}`,
                amount: bargain.offeredPrice,
                currency: bargain.product.currency,
                state: DealState.PENDING,
              },
            });

        return { updatedOffer: accepted, targetDeal: deal };
      },
    );

    if (targetDeal?.id && this.supabaseService) {
      await this.supabaseService.broadcastBargainEvent(
        targetDeal.id,
        'bargain:offer_accepted',
        {
          dealId: targetDeal.id,
          offerId: bargain.id,
          productId: bargain.productId,
          buyerId: bargain.buyerId,
          offeredPrice: Number(bargain.offeredPrice),
          status: 'ACCEPTED',
        },
      );
    }

    if (targetDeal?.id) {
      this.notificationsService?.notifyOfferUpdated(bargain.buyerId, {
        dealId: targetDeal.id,
        dealTitle: targetDeal.title,
        price: Number(bargain.offeredPrice),
        currency: targetDeal.currency,
        status: 'ACCEPTED',
      });
    }

    return { success: true, bargain: updatedOffer, deal: targetDeal };
  }

  async rejectOffer(id: string, currentUser?: RequestUser) {
    const bargain = await this.validateSellerPendingOffer(
      id,
      'từ chối',
      currentUser,
    );

    const updatedOffer = await this.prisma.bargainOffer.update({
      where: { id },
      data: {
        status: BargainStatus.REJECTED,
        negotiationData: {
          ...((bargain.negotiationData as Record<string, unknown>) ?? {}),
          respondedAt: new Date().toISOString(),
        },
      },
    });

    const targetDeal = await findDealForBargain(this.prisma, bargain);
    if (targetDeal?.id && this.supabaseService) {
      await this.supabaseService.broadcastBargainEvent(
        targetDeal.id,
        'bargain:offer_rejected',
        {
          dealId: targetDeal.id,
          offerId: bargain.id,
          productId: bargain.productId,
          buyerId: bargain.buyerId,
          status: 'REJECTED',
        },
      );
    }

    return { success: true, bargain: updatedOffer, deal: targetDeal };
  }

  async respond(id: string, dto: RespondBargainDto, currentUser?: RequestUser) {
    if (dto.status === 'ACCEPTED') {
      return this.acceptOffer(id, currentUser);
    }
    return this.rejectOffer(id, currentUser);
  }
}
