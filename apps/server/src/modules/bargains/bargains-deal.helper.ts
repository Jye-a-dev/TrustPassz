import { DealState, Prisma } from '@prisma/client';

/**
 * Resolves or provisions a Product & Order record when a bargain is created from an existing Deal.
 */
export async function resolveOrProvisionDealProduct(
  prisma:
    | Prisma.TransactionClient
    | { product: Prisma.ProductDelegate; order: Prisma.OrderDelegate },
  deal: {
    id: string;
    sellerId: string;
    title: string;
    amount: Prisma.Decimal;
    order: { productId: string } | null;
  },
  buyerId: string,
): Promise<string> {
  if (deal.order?.productId) {
    return deal.order.productId;
  }

  let product = await prisma.product.findFirst({
    where: { sellerId: deal.sellerId },
  });
  if (!product) {
    product = await prisma.product.create({
      data: {
        sellerId: deal.sellerId,
        title: deal.title,
        category: 'DIGITAL_ASSET',
        basePrice: deal.amount,
      },
    });
  }

  await prisma.order.upsert({
    where: { dealId: deal.id },
    create: {
      orderNumber: `ORD-${deal.id.slice(0, 8).toUpperCase()}`,
      dealId: deal.id,
      buyerId,
      sellerId: deal.sellerId,
      productId: product.id,
      totalAmount: deal.amount,
    },
    update: { productId: product.id },
  });
  return product.id;
}

/**
 * Finds the associated Escrow Deal for a bargain offer by explicit dealId note or latest PENDING deal.
 */
export async function findDealForBargain(
  client: { deal: Prisma.DealDelegate },
  bargain: {
    buyerId: string;
    negotiationData: Prisma.JsonValue;
    product: { sellerId: string };
  },
) {
  const dealIdFromNote = (
    bargain.negotiationData as Record<string, unknown> | null
  )?.dealId as string | undefined;

  if (dealIdFromNote) {
    const byNote = await client.deal.findUnique({
      where: { id: dealIdFromNote },
    });
    if (byNote) return byNote;
  }

  return client.deal.findFirst({
    where: {
      sellerId: bargain.product.sellerId,
      buyerId: bargain.buyerId,
      state: DealState.PENDING,
    },
    orderBy: { createdAt: 'desc' },
  });
}
