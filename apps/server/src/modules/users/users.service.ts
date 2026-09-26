import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateStorefrontDto, UpdateStorefrontDto } from './dto/storefront.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(role?: UserRole) {
    return this.prisma.user.findMany({
      where: role ? { role } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        storefront: true,
      },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        storefront: true,
        _count: {
          select: {
            sellerDeals: true,
            buyerDeals: true,
            sellerOrders: true,
            buyerOrders: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findById(id);

    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          ...(dto.email !== undefined && { email: dto.email }),
          ...(dto.phone !== undefined && { phone: dto.phone }),
          ...(dto.walletAddress !== undefined && {
            walletAddress: dto.walletAddress.toLowerCase(),
          }),
          ...(dto.displayName !== undefined && { displayName: dto.displayName }),
          ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
          ...(dto.role !== undefined && { role: dto.role }),
        },
        include: {
          storefront: true,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException(
          'Email, phone, or wallet address already in use by another account',
        );
      }
      throw error;
    }
  }

  async createStorefront(dto: CreateStorefrontDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.sellerId },
      include: { storefront: true },
    });

    if (!user) {
      throw new NotFoundException(`Seller user with ID ${dto.sellerId} not found`);
    }

    if (user.storefront) {
      throw new ConflictException('Seller already has an active storefront');
    }

    const existingSlug = await this.prisma.storefront.findUnique({
      where: { slug: dto.slug },
    });

    if (existingSlug) {
      throw new ConflictException(`Storefront slug '${dto.slug}' is already taken`);
    }

    return this.prisma.storefront.create({
      data: {
        sellerId: dto.sellerId,
        slug: dto.slug,
        shopName: dto.shopName,
        bio: dto.bio,
        customConfig: (dto.customConfig as any) ?? {
          theme: 'dark',
          social_links: {},
          banner_url: null,
          canvas_layout: [],
        },
      },
      include: {
        seller: {
          select: {
            id: true,
            displayName: true,
            email: true,
            walletAddress: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async getStorefrontBySlug(slug: string) {
    const storefront = await this.prisma.storefront.findUnique({
      where: { slug },
      include: {
        seller: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            walletAddress: true,
          },
        },
        products: {
          where: { status: 'ACTIVE' },
          take: 20,
        },
      },
    });

    if (!storefront) {
      throw new NotFoundException(`Storefront with slug '${slug}' not found`);
    }

    return storefront;
  }

  async updateStorefront(id: string, dto: UpdateStorefrontDto) {
    const storefront = await this.prisma.storefront.findUnique({
      where: { id },
    });

    if (!storefront) {
      throw new NotFoundException(`Storefront with ID ${id} not found`);
    }

    return this.prisma.storefront.update({
      where: { id },
      data: {
        ...(dto.slug && { slug: dto.slug }),
        ...(dto.shopName && { shopName: dto.shopName }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.customConfig && { customConfig: dto.customConfig as any }),
      },
    });
  }
}
