import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const SEEDED_USER_EMAILS = [
  'seller@trustpassz.io',
  'buyer@trustpassz.io',
  'admin@trustpassz.io',
] as const;

export interface CleanupSummary {
  targetEmails: readonly string[];
  matchedUsersCount: number;
  deletedDisputeLogs: number;
  deletedDigitalAssets: number;
  deletedOrders: number;
  deletedDeals: number;
  deletedBargainOffers: number;
  deletedProducts: number;
  deletedStorefronts: number;
  deletedUsers: number;
  remainingTargetCount: number;
}

export async function cleanSeededUsers(): Promise<CleanupSummary> {
  console.log('[CLEANUP] Starting safe database purge for seeded mock accounts:');
  SEEDED_USER_EMAILS.forEach((email) => console.log(`  - Target: ${email}`));

  // 1. Locate existing target users
  const targetUsers = await prisma.user.findMany({
    where: {
      email: {
        in: [...SEEDED_USER_EMAILS],
        mode: 'insensitive',
      },
    },
    select: {
      id: true,
      email: true,
      role: true,
      displayName: true,
    },
  });

  if (targetUsers.length === 0) {
    console.log('[CLEANUP] No seeded mock users found in database. Count is 0.');
    return {
      targetEmails: SEEDED_USER_EMAILS,
      matchedUsersCount: 0,
      deletedDisputeLogs: 0,
      deletedDigitalAssets: 0,
      deletedOrders: 0,
      deletedDeals: 0,
      deletedBargainOffers: 0,
      deletedProducts: 0,
      deletedStorefronts: 0,
      deletedUsers: 0,
      remainingTargetCount: 0,
    };
  }

  const userIds = targetUsers.map((u) => u.id);
  console.log(`[CLEANUP] Located ${targetUsers.length} user(s) to remove:`);
  targetUsers.forEach((u) => console.log(`  - [${u.role}] ${u.email} (${u.id})`));

  // 2. Execute transactional cascade-safe purge
  const summary = await prisma.$transaction(async (tx) => {
    // 2.1 Identify associated Deals
    const associatedDeals = await tx.deal.findMany({
      where: {
        OR: [
          { sellerId: { in: userIds } },
          { buyerId: { in: userIds } },
        ],
      },
      select: { id: true },
    });
    const dealIds = associatedDeals.map((d) => d.id);

    // 2.2 Identify associated Products
    const associatedProducts = await tx.product.findMany({
      where: {
        sellerId: { in: userIds },
      },
      select: { id: true },
    });
    const productIds = associatedProducts.map((p) => p.id);

    // 2.3 Cascade delete DisputeLogs linked to deals or users
    const deletedDisputeLogs = await tx.disputeLog.deleteMany({
      where: {
        OR: [
          { dealId: { in: dealIds } },
          { initiatorId: { in: userIds } },
          { resolvedById: { in: userIds } },
        ],
      },
    });

    // 2.4 Cascade delete DigitalAssets linked to deals
    const deletedDigitalAssets = await tx.digitalAsset.deleteMany({
      where: {
        dealId: { in: dealIds },
      },
    });

    // 2.5 Delete Orders linked to deals, products, or users
    const deletedOrders = await tx.order.deleteMany({
      where: {
        OR: [
          { dealId: { in: dealIds } },
          { productId: { in: productIds } },
          { buyerId: { in: userIds } },
          { sellerId: { in: userIds } },
        ],
      },
    });

    // 2.6 Delete Deals
    const deletedDeals = await tx.deal.deleteMany({
      where: {
        id: { in: dealIds },
      },
    });

    // 2.7 Delete BargainOffers linked to products or buyer users
    const deletedBargainOffers = await tx.bargainOffer.deleteMany({
      where: {
        OR: [
          { productId: { in: productIds } },
          { buyerId: { in: userIds } },
        ],
      },
    });

    // 2.8 Delete Products
    const deletedProducts = await tx.product.deleteMany({
      where: {
        id: { in: productIds },
      },
    });

    // 2.9 Delete Storefronts
    const deletedStorefronts = await tx.storefront.deleteMany({
      where: {
        sellerId: { in: userIds },
      },
    });

    // 2.10 Nullify references in audit and auxiliary tables if present
    const auxTables = [
      { table: 'audit_logs', col: 'admin_id' },
      { table: 'relayer_funding_logs', col: 'admin_user_id' },
      { table: 'fiat_crypto_funding_orders', col: 'admin_id' },
    ];
    for (const { table, col } of auxTables) {
      try {
        await tx.$executeRawUnsafe(
          `UPDATE "${table}" SET "${col}" = NULL WHERE "${col}"::text = ANY($1::text[])`,
          userIds,
        );
      } catch {
        // Table or column might not exist in the current database schema
      }
    }

    // 2.11 Purge emergency mailing list entries for seeded emails
    await tx.emergencyMailingList.deleteMany({
      where: {
        email: {
          in: [...SEEDED_USER_EMAILS],
          mode: 'insensitive',
        },
      },
    });

    // 2.12 Finally, purge target User records
    const deletedUsers = await tx.user.deleteMany({
      where: {
        id: { in: userIds },
      },
    });

    return {
      targetEmails: SEEDED_USER_EMAILS,
      matchedUsersCount: targetUsers.length,
      deletedDisputeLogs: deletedDisputeLogs.count,
      deletedDigitalAssets: deletedDigitalAssets.count,
      deletedOrders: deletedOrders.count,
      deletedDeals: deletedDeals.count,
      deletedBargainOffers: deletedBargainOffers.count,
      deletedProducts: deletedProducts.count,
      deletedStorefronts: deletedStorefronts.count,
      deletedUsers: deletedUsers.count,
    };
  });

  // 3. Post-execution verification
  const remainingTargetCount = await prisma.user.count({
    where: {
      email: {
        in: [...SEEDED_USER_EMAILS],
        mode: 'insensitive',
      },
    },
  });

  const result: CleanupSummary = {
    ...summary,
    remainingTargetCount,
  };

  console.log('[CLEANUP] Deletion transaction finished successfully:');
  console.log(`  - Deleted users: ${result.deletedUsers}`);
  console.log(`  - Deleted deals: ${result.deletedDeals}`);
  console.log(`  - Deleted orders: ${result.deletedOrders}`);
  console.log(`  - Deleted products: ${result.deletedProducts}`);
  console.log(`  - Remaining target users count in DB: ${result.remainingTargetCount}`);

  return result;
}

async function run(): Promise<void> {
  try {
    const result = await cleanSeededUsers();
    if (result.remainingTargetCount > 0) {
      console.error(`[ERROR] Verification failed: ${result.remainingTargetCount} target user(s) remain.`);
      process.exit(1);
    }
    console.log('[SUCCESS] Database clean-up completed. Target seeded user count = 0.');
    process.exit(0);
  } catch (error) {
    console.error('[FATAL] Failed to clean up seeded users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void run();
}
