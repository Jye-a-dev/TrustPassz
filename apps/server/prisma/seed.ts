import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * TrustPassz Database Seeder.
 *
 * NOTE: User account seeding is PERMANENTLY DISABLED to protect database integrity
 * and prevent mock credentials from existing in production or staging.
 * All user identities must be established via authentic OAuth, Solana SIWS, Passkey, or Email flows.
 */
async function main(): Promise<void> {
  console.log('[SEED] Running Prisma database seed configuration...');
  console.log('[SEED] User account seeding is PERMANENTLY DISABLED.');
  console.log('[SEED] System initialization completed with 0 seeded users.');
}

main()
  .catch((e: unknown) => {
    console.error('[SEED] Error during seed execution:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
