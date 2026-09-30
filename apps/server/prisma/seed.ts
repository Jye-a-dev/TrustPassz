import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Automated mock data seeding is disabled to preserve database integrity.
  console.log('Automated mock data seeding is disabled.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
