import { DealState, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { DEAL_LIST_INCLUDE } from './deals.helper';
import { QueryDealDto } from './dto/query-deal.dto';

export interface EscrowBalanceResult {
  lockedBalance: number;
  availableBalance: number;
  disputedBalance: number;
  totalBalance: number;
  activeDealsCount: number;
}

export async function executeFindMyDeals(
  prisma: PrismaService,
  userId: string,
  query: QueryDealDto,
) {
  const page = query.page && query.page > 0 ? Number(query.page) : 1;
  const limit = query.limit && query.limit > 0 ? Number(query.limit) : 10;
  const skip = (page - 1) * limit;

  const where: Prisma.DealWhereInput = {
    OR: [{ sellerId: userId }, { buyerId: userId }],
    ...(query.state && (query.state as string) !== 'ALL'
      ? { state: query.state }
      : {}),
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [deals, total] = await Promise.all([
    prisma.deal.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: DEAL_LIST_INCLUDE,
    }),
    prisma.deal.count({ where }),
  ]);

  return {
    data: deals,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function executeCalculateUserEscrowBalance(
  prisma: PrismaService,
  userId: string,
): Promise<EscrowBalanceResult> {
  const deals = await prisma.deal.findMany({
    where: {
      OR: [{ sellerId: userId }, { buyerId: userId }],
    },
    select: {
      id: true,
      state: true,
      amount: true,
      sellerId: true,
      buyerId: true,
    },
  });

  let lockedBalance = 0;
  let availableBalance = 0;
  let disputedBalance = 0;
  let activeDealsCount = 0;

  for (const deal of deals) {
    const amount = Number(deal.amount);
    switch (deal.state) {
      case DealState.DEPOSITED:
      case DealState.IN_INSPECTION:
        lockedBalance += amount;
        activeDealsCount++;
        break;
      case DealState.PENDING:
        activeDealsCount++;
        break;
      case DealState.SETTLED:
        if (deal.sellerId === userId) {
          availableBalance += amount;
        }
        break;
      case DealState.DISPUTED:
        disputedBalance += amount;
        activeDealsCount++;
        break;
      default:
        break;
    }
  }

  return {
    lockedBalance,
    availableBalance,
    disputedBalance,
    totalBalance: lockedBalance + availableBalance,
    activeDealsCount,
  };
}
