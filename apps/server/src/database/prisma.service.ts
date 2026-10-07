import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

function ensureEnvironmentLoaded() {
  if (process.env.DATABASE_URL) return;

  const candidatePaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'apps/server/.env'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../../../.env'),
  ];

  for (const envPath of candidatePaths) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      if (process.env.DATABASE_URL) break;
    }
  }
}

ensureEnvironmentLoaded();

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    ensureEnvironmentLoaded();
    super({
      datasources: process.env.DATABASE_URL
        ? {
            db: {
              url: process.env.DATABASE_URL,
            },
          }
        : undefined,
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
