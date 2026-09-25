import { AssetType, DealState, Prisma } from '@prisma/client';
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
