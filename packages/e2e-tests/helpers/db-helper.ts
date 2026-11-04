import { PrismaClient, DealState, DisputeStatus } from '@prisma/client';
import {
  SELLER_WALLET,
  BUYER_WALLET,
  ADMIN_WALLET,
} from '../fixtures/test-wallets';

export class DbHelper {
  private static instance: PrismaClient | null = null;

  static getClient(): PrismaClient {
    if (!DbHelper.instance) {
      DbHelper.instance = new PrismaClient({
        datasources: {
          db: {
            url:
              process.env.DATABASE_URL ||
              'postgresql://neondb_owner:npg_wHX7LN9cthEz@ep-nameless-sun-b3lmwbbs-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
          },
        },
      });
    }
    return DbHelper.instance;
  }

  static async disconnect(): Promise<void> {
    if (DbHelper.instance) {
      await DbHelper.instance.$disconnect();
      DbHelper.instance = null;
    }
  }

  /**
   * Seed/Ensure standard E2E test users exist in Neon DB with roles.
   */
  static async ensureTestUsers(): Promise<void> {
    const prisma = DbHelper.getClient();
    const testUsers = [SELLER_WALLET, BUYER_WALLET, ADMIN_WALLET];

    for (const u of testUsers) {
      await prisma.user.upsert({
        where: { id: u.id },
        update: {
          email: u.email,
          walletAddress: u.walletAddress,
          displayName: u.displayName,
          role: u.role,
        },
        create: {
          id: u.id,
          email: u.email,
          walletAddress: u.walletAddress,
          displayName: u.displayName,
          role: u.role,
        },
      });
    }
  }

  /**
   * Fetches full Deal snapshot from Neon DB with associated entities.
   */
  static async findDealById(id: string) {
    const prisma = DbHelper.getClient();
    return prisma.deal.findUnique({
      where: { id },
      include: {
        digitalAsset: true,
        disputeLogs: true,
        order: true,
      },
    });
  }

  /**
   * Fetches dispute log for a deal.
   */
  static async findDisputeByDealId(dealId: string) {
    const prisma = DbHelper.getClient();
    return prisma.disputeLog.findFirst({
      where: { dealId },
      orderBy: { createdAt: 'desc' },
      include: {
        deal: true,
        initiator: true,
        resolvedBy: true,
      },
    });
  }

  /**
   * Safely cleans up test deals and cascading digital assets/disputes.
   */
  static async cleanupDeals(dealIds: string[]): Promise<void> {
    if (!dealIds.length) return;
    const prisma = DbHelper.getClient();
    try {
      await prisma.disputeLog.deleteMany({
        where: { dealId: { in: dealIds } },
      });
      await prisma.digitalAsset.deleteMany({
        where: { dealId: { in: dealIds } },
      });
      await prisma.order.deleteMany({
        where: { dealId: { in: dealIds } },
      });
      await prisma.deal.deleteMany({
        where: { id: { in: dealIds } },
      });
    } catch (err: unknown) {
      // Non-fatal cleanup warning
      console.warn(`[DbHelper] Cleanup warning: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
