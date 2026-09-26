import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateProductDto,
  QueryProductDto,
  UpdateProductDto,
} from './dto/product.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    const seller = await this.prisma.user.findUnique({
      where: { id: dto.sellerId },
    });

    if (!seller) {
      throw new NotFoundException(`Seller user ${dto.sellerId} not found`);
    }

    if (dto.storefrontId) {
      const sf = await this.prisma.storefront.findUnique({
        where: { id: dto.storefrontId },
      });
      if (!sf) {
        throw new NotFoundException(`Storefront ${dto.storefrontId} not found`);
      }
    }

    return this.prisma.product.create({
      data: {
        sellerId: dto.sellerId,
        storefrontId: dto.storefrontId,
        title: dto.title,
        category: dto.category,
        basePrice: new Prisma.Decimal(dto.basePrice),
        floorPrice: dto.floorPrice ? new Prisma.Decimal(dto.floorPrice) : null,
        currency: dto.currency ?? 'VND',
        status: dto.status ?? 'ACTIVE',
        specAttributes: (dto.specAttributes as any) ?? {},
        ruleConfig: (dto.ruleConfig as any) ?? {},
      },
      include: {
        seller: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async findAll(query: QueryProductDto) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      ...(query.category && { category: query.category }),
      ...(query.status && { status: query.status }),
      ...(query.sellerId && { sellerId: query.sellerId }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { category: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          seller: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          storefront: {
            select: {
              id: true,
              slug: true,
              shopName: true,
            },
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
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            walletAddress: true,
          },
        },
        storefront: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);

    return this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.category && { category: dto.category }),
        ...(dto.basePrice !== undefined && {
          basePrice: new Prisma.Decimal(dto.basePrice),
        }),
        ...(dto.floorPrice !== undefined && {
          floorPrice: dto.floorPrice ? new Prisma.Decimal(dto.floorPrice) : null,
        }),
        ...(dto.status && { status: dto.status }),
        ...(dto.specAttributes && { specAttributes: dto.specAttributes as any }),
        ...(dto.ruleConfig && { ruleConfig: dto.ruleConfig as any }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.product.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  }
}
