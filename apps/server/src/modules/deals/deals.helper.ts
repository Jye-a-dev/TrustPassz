import {
  AssetType,
  Deal,
  DealState,
  DigitalAsset,
  Prisma,
} from '@prisma/client';
import { CreateDealDto, EncryptedAssetDto } from './dto/create-deal.dto';
import { QueryDealDto } from './dto/query-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';

export const DEAL_PUBLIC_USER_SELECT = {
  id: true,
  walletAddress: true,
  displayName: true,
  avatarUrl: true,
} as const;

export const DEAL_DETAIL_USER_SELECT = {
  id: true,
  email: true,
  walletAddress: true,
  displayName: true,
  avatarUrl: true,
  role: true,
} as const;

export const DEAL_LIST_INCLUDE = {
  digitalAsset: true,
  seller: { select: DEAL_PUBLIC_USER_SELECT },
  buyer: { select: DEAL_PUBLIC_USER_SELECT },
} as const;

export const DEAL_DETAIL_INCLUDE = {
  seller: { select: DEAL_DETAIL_USER_SELECT },
  buyer: { select: DEAL_DETAIL_USER_SELECT },
  digitalAsset: true,
  disputeLogs: true,
} as const;

export function buildCountBreakdown(
  grouped: Array<{ state: DealState; _count: { id: number } }>,
): Record<DealState, number> {
  const breakdown: Record<DealState, number> = {
    [DealState.PENDING]: 0,
    [DealState.DEPOSITED]: 0,
    [DealState.IN_INSPECTION]: 0,
    [DealState.SETTLED]: 0,
    [DealState.REFUNDED]: 0,
    [DealState.DISPUTED]: 0,
  };

  for (const item of grouped) {
    breakdown[item.state] = item._count.id;
  }

  return breakdown;
}

export function buildDealWhereInput(
  query: QueryDealDto,
): Prisma.DealWhereInput {
  return {
    ...(query.state ? { state: query.state } : {}),
    ...(query.sellerId ? { sellerId: query.sellerId } : {}),
    ...(query.buyerId ? { buyerId: query.buyerId } : {}),
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
}

export function buildDealCreateData(
  dealData: Omit<CreateDealDto, 'digitalAsset'>,
): Prisma.DealUncheckedCreateInput {
  return {
    sellerId: dealData.sellerId,
    buyerId: dealData.buyerId || null,
    title: dealData.title,
    description: dealData.description || null,
    amount: new Prisma.Decimal(dealData.amount),
    currency: dealData.currency || 'VND',
    state: DealState.PENDING,
    inspectionDuration: dealData.inspectionDuration || 86400,
    onchainDealId: dealData.onchainDealId || null,
  };
}

export function buildDigitalAssetCreateData(
  dealId: string,
  asset: EncryptedAssetDto,
): Prisma.DigitalAssetUncheckedCreateInput {
  return {
    dealId,
    assetType: asset.assetType || AssetType.SOURCE_CODE,
    encryptedContent: asset.encryptedContent,
    encryptionIv: asset.encryptionIv,
    authTag: asset.authTag,
    contentHash: asset.contentHash || null,
    fileName: asset.fileName || null,
    fileSizeBytes: asset.fileSizeBytes ? BigInt(asset.fileSizeBytes) : null,
    maxAccessLimit: asset.maxAccessLimit ?? 1,
  };
}

export function buildDealUpdateData(
  dealUpdates: Omit<UpdateDealDto, 'digitalAsset'>,
): Prisma.DealUpdateInput {
  return {
    ...(dealUpdates.title !== undefined && { title: dealUpdates.title }),
    ...(dealUpdates.description !== undefined && {
      description: dealUpdates.description,
    }),
    ...(dealUpdates.amount !== undefined && {
      amount: new Prisma.Decimal(dealUpdates.amount),
    }),
    ...(dealUpdates.currency !== undefined && {
      currency: dealUpdates.currency,
    }),
    ...(dealUpdates.state !== undefined && { state: dealUpdates.state }),
    ...(dealUpdates.inspectionDuration !== undefined && {
      inspectionDuration: dealUpdates.inspectionDuration,
    }),
    ...(dealUpdates.buyerId !== undefined && { buyerId: dealUpdates.buyerId }),
    ...(dealUpdates.onchainDealId !== undefined && {
      onchainDealId: dealUpdates.onchainDealId,
    }),
    ...(dealUpdates.settleTxHash !== undefined && {
      settleTxHash: dealUpdates.settleTxHash,
    }),
    ...(dealUpdates.disputeTxHash !== undefined && {
      disputeTxHash: dealUpdates.disputeTxHash,
    }),
    ...(dealUpdates.paymentRefId !== undefined && {
      paymentRefId: dealUpdates.paymentRefId,
    }),
    ...(dealUpdates.webhookIdempotencyKey !== undefined && {
      webhookIdempotencyKey: dealUpdates.webhookIdempotencyKey,
    }),
    ...(dealUpdates.paymentOrderCode !== undefined && {
      paymentOrderCode:
        dealUpdates.paymentOrderCode !== null
          ? BigInt(dealUpdates.paymentOrderCode)
          : null,
    }),
    ...(dealUpdates.depositedAt !== undefined && {
      depositedAt: dealUpdates.depositedAt
        ? new Date(dealUpdates.depositedAt)
        : null,
    }),
    ...(dealUpdates.inspectionDeadline !== undefined && {
      inspectionDeadline: dealUpdates.inspectionDeadline
        ? new Date(dealUpdates.inspectionDeadline)
        : null,
    }),
  };
}

export function buildDigitalAssetUpsertInput(
  dealId: string,
  asset: EncryptedAssetDto,
): {
  where: Prisma.DigitalAssetWhereUniqueInput;
  create: Prisma.DigitalAssetUncheckedCreateInput;
  update: Prisma.DigitalAssetUpdateInput;
} {
  return {
    where: { dealId },
    create: buildDigitalAssetCreateData(dealId, asset),
    update: {
      ...(asset.assetType && { assetType: asset.assetType }),
      ...(asset.encryptedContent && {
        encryptedContent: asset.encryptedContent,
      }),
      ...(asset.encryptionIv && { encryptionIv: asset.encryptionIv }),
      ...(asset.authTag && { authTag: asset.authTag }),
      ...(asset.contentHash !== undefined && {
        contentHash: asset.contentHash,
      }),
      ...(asset.fileName !== undefined && { fileName: asset.fileName }),
      ...(asset.fileSizeBytes !== undefined && {
        fileSizeBytes: asset.fileSizeBytes ? BigInt(asset.fileSizeBytes) : null,
      }),
      ...(asset.maxAccessLimit !== undefined && {
        maxAccessLimit: asset.maxAccessLimit,
      }),
    },
  };
}

export function formatVaultUnlockResponse(
  dealId: string,
  updatedAsset: DigitalAsset,
) {
  return {
    success: true,
    message: 'Digital vault asset unlocked successfully',
    dealId,
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

interface CachedDealResponse<T = unknown> {
  result: T;
  expiresAt: number;
}

export class DealIdempotencyManager {
  private static inFlight = new Map<string, Promise<unknown>>();
  private static cache = new Map<string, CachedDealResponse>();
  private static readonly TTL_MS = 60000;

  public static getInFlight<T = unknown>(key: string): Promise<T> | undefined {
    return this.inFlight.get(key) as Promise<T> | undefined;
  }

  public static setInFlight<T = unknown>(
    key: string,
    promise: Promise<T>,
  ): void {
    this.inFlight.set(key, promise);
  }

  public static deleteInFlight(key: string): void {
    this.inFlight.delete(key);
  }

  public static getCached<T = unknown>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.result as T;
  }

  public static setCache<T = unknown>(
    key: string,
    result: T,
    ttlMs: number = this.TTL_MS,
  ): void {
    if (this.cache.size > 1000) {
      const now = Date.now();
      for (const [k, v] of this.cache.entries()) {
        if (now > v.expiresAt) this.cache.delete(k);
      }
    }
    this.cache.set(key, { result, expiresAt: Date.now() + ttlMs });
  }

  public static deriveKey(
    sellerId: string,
    idempotencyKey?: string,
    contentHash?: string,
    title?: string,
    amount?: number,
  ): string {
    if (idempotencyKey && idempotencyKey.trim()) {
      return `idem:${sellerId}:${idempotencyKey.trim()}`;
    }
    return this.deriveSemanticKey(sellerId, title, amount, contentHash);
  }

  public static deriveSemanticKey(
    sellerId: string,
    title?: string,
    amount?: number,
    contentHash?: string,
  ): string {
    const cleanTitle = (title || 'deal').trim().toLowerCase();
    const cleanAmount = Number(amount || 0);
    const hash = contentHash ? `:${contentHash}` : '';
    return `semantic:${sellerId}:${cleanTitle}:${cleanAmount}${hash}`;
  }
}

export async function findRecentDuplicateDeal(
  prisma: { deal: { findFirst: (args: any) => Promise<any> } },
  sellerId: string,
  title: string,
  amount: number,
  contentHash?: string,
  windowMs = 60000,
): Promise<(Deal & { digitalAsset: DigitalAsset | null }) | null> {
  return prisma.deal.findFirst({
    where: {
      sellerId,
      title,
      amount: new Prisma.Decimal(amount),
      state: DealState.PENDING,
      createdAt: { gte: new Date(Date.now() - windowMs) },
      ...(contentHash ? { digitalAsset: { contentHash } } : {}),
    },
    include: { digitalAsset: true },
  });
}

export async function executeDealCreateTransaction(
  prisma: { $transaction: (fn: (tx: any) => Promise<any>) => Promise<any> },
  dealData: Omit<CreateDealDto, 'digitalAsset'>,
  digitalAsset?: EncryptedAssetDto,
): Promise<Deal & { digitalAsset: DigitalAsset | null }> {
  return prisma.$transaction(async (tx) => {
    const deal = await tx.deal.create({
      data: buildDealCreateData(dealData),
    });

    let createdAsset: DigitalAsset | null = null;
    if (digitalAsset) {
      createdAsset = await tx.digitalAsset.create({
        data: buildDigitalAssetCreateData(
          (deal as { id: string }).id,
          digitalAsset,
        ),
      });
    }

    return {
      ...deal,
      digitalAsset: createdAsset,
    };
  });
}

export async function executeDealUpdateTransaction(
  prisma: { $transaction: (fn: (tx: any) => Promise<any>) => Promise<any> },
  id: string,
  dealUpdates: Omit<UpdateDealDto, 'digitalAsset'>,
  digitalAsset?: EncryptedAssetDto,
): Promise<any> {
  return prisma.$transaction(async (tx) => {
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
}
