import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateOrderDto,
  QueryOrderDto,
  UpdateOrderStatusDto,
} from './dto/order.dto';
import { DealState, OrderStatus, Prisma } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrderDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product ${dto.productId} not found`);
    }

    if (product.status !== 'ACTIVE') {
      throw new BadRequestException('Product is not currently available for purchase');
    }

    const buyer = await this.prisma.user.findUnique({
      where: { id: dto.buyerId },
    });

    if (!buyer) {
      throw new NotFoundException(`Buyer ${dto.buyerId} not found`);
    }

    if (product.sellerId === dto.buyerId) {
      throw new BadRequestException('Seller cannot order their own product');
    }

    return this.prisma.$transaction(async (tx) => {
      let dealId = dto.dealId;

      if (!dealId) {
        const deal = await tx.deal.create({
          data: {
            sellerId: product.sellerId,
            buyerId: dto.buyerId,
            title: `Order Deal: ${product.title}`,
            amount: product.basePrice,
            currency: product.currency,
            state: DealState.PENDING,
          },
        });
        dealId = deal.id;
      }

      const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      return tx.order.create({
        data: {
          orderNumber,
          dealId,
          buyerId: dto.buyerId,
          sellerId: product.sellerId,
          productId: dto.productId,
          totalAmount: product.basePrice,
          status: OrderStatus.PENDING_PAYMENT,
          shippingInfo: (dto.shippingInfo as any) ?? {},
        },
        include: {
          product: true,
          deal: true,
          seller: {
            select: { id: true, displayName: true, email: true },
          },
          buyer: {
            select: { id: true, displayName: true, email: true },
          },
        },
      });
    });
  }

  async findAll(query: QueryOrderDto) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      ...(query.status && { status: query.status }),
      ...(query.buyerId && { buyerId: query.buyerId }),
      ...(query.sellerId && { sellerId: query.sellerId }),
    };

    const [total, data] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { id: true, title: true, category: true, basePrice: true },
          },
          deal: {
            select: { id: true, state: true, amount: true },
          },
          buyer: {
            select: { id: true, displayName: true },
          },
          seller: {
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
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        product: true,
        deal: {
          include: {
            digitalAsset: true,
            disputeLogs: true,
          },
        },
        buyer: {
          select: { id: true, displayName: true, email: true, walletAddress: true },
        },
        seller: {
          select: { id: true, displayName: true, email: true, walletAddress: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.findOne(id);

    return this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.shippingInfo && { shippingInfo: dto.shippingInfo as any }),
        ...(dto.paymentMetadata && {
          paymentMetadata: dto.paymentMetadata as any,
        }),
      },
    });
  }
}
