import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OracleRelayerService } from '../oracle-relayer/oracle-relayer.service';

export interface HealthResponsePayload {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  version: string;
  environment: string;
  timestamp: string;
  uptimeSeconds: number;
  mode?: 'lightweight' | 'deep';
  database?: {
    status: 'up' | 'down';
    provider: string;
    latencyMs: number;
    error?: string;
  };
  memory: {
    status: 'up';
    rssMB: number;
    heapTotalMB: number;
    heapUsedMB: number;
    heapUsedPercent: number;
  };
  relayer?: {
    status: 'up' | 'down';
    network: string;
    chainId: number;
    contractAddress: string;
    latestBlock?: number;
    blockTimestamp?: number;
    latencyMs: number;
    error?: string;
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly oracleRelayerService: OracleRelayerService,
  ) {}

  async checkHealth(deep = false): Promise<HealthResponsePayload> {
    // Process memory footprint (fast execution < 1ms)
    const memUsage = process.memoryUsage();
    const heapUsedMB = Number((memUsage.heapUsed / (1024 * 1024)).toFixed(2));
    const heapTotalMB = Number((memUsage.heapTotal / (1024 * 1024)).toFixed(2));
    const rssMB = Number((memUsage.rss / (1024 * 1024)).toFixed(2));
    const heapUsedPercent = Number(
      ((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(1),
    );

    const basePayload = {
      service: 'TrustPassz Unified API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Number(process.uptime().toFixed(1)),
      memory: {
        status: 'up' as const,
        rssMB,
        heapTotalMB,
        heapUsedMB,
        heapUsedPercent,
      },
    };

    // Fast-path: Render ping / UptimeRobot (no DB/RPC overhead, guarantees < 500ms)
    if (!deep) {
      return {
        ...basePayload,
        status: 'healthy',
        mode: 'lightweight',
      };
    }

    const dbStartTime = Date.now();
    let dbStatus: 'up' | 'down' = 'up';
    let dbLatencyMs = 0;
    let dbError: string | undefined;

    try {
      // Ping Neon PostgreSQL via raw query
      await this.prisma.$queryRaw`SELECT 1 as ping`;
      dbLatencyMs = Date.now() - dbStartTime;
    } catch (err: any) {
      dbStatus = 'down';
      dbLatencyMs = Date.now() - dbStartTime;
      dbError = err?.message || 'Database connection error';
      this.logger.error(`Database health check failed: ${dbError}`);
    }

    // On-chain Relayer & Base Sepolia block timestamp check
    const relayerStatus = await this.oracleRelayerService.getChainStatus();

    // Determine aggregate system status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (dbStatus === 'down') {
      overallStatus = 'unhealthy';
    } else if (relayerStatus.status === 'down') {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      service: 'TrustPassz Unified API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Number(process.uptime().toFixed(1)),
      mode: 'deep',
      database: {
        status: dbStatus,
        provider: 'Neon PostgreSQL (pgBouncer Pool)',
        latencyMs: dbLatencyMs,
        ...(dbError ? { error: dbError } : {}),
      },
      memory: {
        status: 'up',
        rssMB,
        heapTotalMB,
        heapUsedMB,
        heapUsedPercent,
      },
      relayer: {
        status: relayerStatus.status,
        network: relayerStatus.network,
        chainId: relayerStatus.chainId,
        contractAddress: relayerStatus.contractAddress,
        latestBlock: relayerStatus.latestBlock,
        blockTimestamp: relayerStatus.blockTimestamp,
        latencyMs: relayerStatus.latencyMs,
        ...(relayerStatus.error ? { error: relayerStatus.error } : {}),
      },
    };
  }
}
