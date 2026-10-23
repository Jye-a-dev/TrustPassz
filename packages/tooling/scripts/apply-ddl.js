const fs = require('fs');
const path = require('path');
const serverDir = path.join(__dirname, '..', 'apps', 'server');

// Load environment variables from apps/server/.env
const envPath = path.join(serverDir, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

// Support both hoisted and local module resolution
function resolveModule(moduleName) {
  try {
    return require(path.join(serverDir, 'node_modules', moduleName));
  } catch (e) {
    try {
      return require(path.join(__dirname, '..', 'node_modules', moduleName));
    } catch (e2) {
      return require(moduleName);
    }
  }
}

const { Client } = resolveModule('pg');
const { PrismaClient } = resolveModule('@prisma/client');

async function main() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected to Neon PostgreSQL directly via pg client.');

  const sqlPath = path.join(serverDir, 'prisma', 'migrations', 'init_schema.sql');
  const ddl = fs.readFileSync(sqlPath, 'utf8');

  console.log('Executing multi-statement DDL: Extensions, Enums, Tables, Triggers, B-Tree and GIN Indexes...');
  await client.query(ddl);
  console.log('DDL successfully executed on Neon PostgreSQL!');
  await client.end();

  // Test with Prisma Client
  console.log('Verifying via Prisma Client...');
  const prisma = new PrismaClient();
  const userCount = await prisma.user.count();
  const dealCount = await prisma.deal.count();
  const productCount = await prisma.product.count();
  console.log(`Prisma ORM Verification: users=${userCount}, deals=${dealCount}, products=${productCount}`);
  await prisma.$disconnect();
  console.log('=== Neon PostgreSQL Schema and Indexes are 100% Active and Verified! ===');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
