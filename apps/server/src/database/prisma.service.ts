import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

function ensureEnvironmentLoaded(): void {
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
  private readonly logger = new Logger(PrismaService.name);

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
      log:
        process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  async onModuleInit(): Promise<void> {
    const maxRetries = 5;
    const baseDelaysMs = [2000, 3000, 5000, 8000, 10000];

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        this.logger.log(
          `[PrismaService] Successfully connected to PostgreSQL (attempt ${attempt}/${maxRetries}).`,
        );
        return;
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);

        if (attempt === maxRetries) {
          this.logger.error(
            `[PrismaService] Failed to connect after ${maxRetries} attempts: ${errorMsg}`,
          );
          throw error;
        }

        const delayMs = baseDelaysMs[attempt - 1] ?? 5000;
        this.logger.warn(
          `[PrismaService] Neon Compute is waking up, retrying in ${delayMs}ms... (attempt ${attempt}/${maxRetries}). Cause: ${errorMsg}`,
        );

        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.$disconnect();
      this.logger.log('[PrismaService] Disconnected from PostgreSQL.');
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[PrismaService] Error during database disconnection: ${errorMsg}`,
      );
    }
  }
}
