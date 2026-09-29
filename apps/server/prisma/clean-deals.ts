import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const targetDealIds = [
    'd0000000-0000-4000-a000-000000000001',
    'd0000000-0000-4000-a000-000000000002',
    'd0000000-0000-4000-a000-000000000003',
    'd0000000-0000-4000-a000-000000000004',
  ];

  console.log(`Starting cleanup for deals: ${targetDealIds.join(', ')}`);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Delete dependent DisputeLogs
    const deletedDisputes = await tx.disputeLog.deleteMany({
      where: { dealId: { in: targetDealIds } },
    });

    // 2. Delete dependent Orders
    const deletedOrders = await tx.order.deleteMany({
      where: { dealId: { in: targetDealIds } },
    });

    // 3. Delete dependent DigitalAssets
    const deletedAssets = await tx.digitalAsset.deleteMany({
      where: { dealId: { in: targetDealIds } },
    });

    // 4. Delete Deals
    const deletedDeals = await tx.deal.deleteMany({
      where: { id: { in: targetDealIds } },
    });

    return {
      deletedDisputes: deletedDisputes.count,
      deletedOrders: deletedOrders.count,
      deletedAssets: deletedAssets.count,
      deletedDeals: deletedDeals.count,
    };
  });

  console.log('Cleanup result:', result);
}

main()
  .catch((e) => {
    console.error('Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
