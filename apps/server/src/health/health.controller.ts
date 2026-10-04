import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { HealthService } from './health.service';

@ApiTags('System & Health')
@SkipThrottle()
@Controller('api/v1/health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Comprehensive Health & Infrastructure Check',
    description:
      'Probes Neon PostgreSQL database pool, system memory metrics, and live Base Sepolia on-chain block state for uptime and readiness.',
  })
  @ApiResponse({
    status: 200,
    description: 'System healthy or degraded (non-critical RPC issue)',
    schema: {
      example: {
        status: 'healthy',
        service: 'TrustPassz Unified API',
        version: '1.0.0',
        environment: 'production',
        timestamp: '2026-10-04T08:30:00.000Z',
        uptimeSeconds: 1420.5,
        database: {
          status: 'up',
          provider: 'Neon PostgreSQL (pgBouncer Pool)',
          latencyMs: 14,
        },
        memory: {
          status: 'up',
          rssMB: 94.2,
          heapTotalMB: 65.5,
          heapUsedMB: 48.1,
          heapUsedPercent: 73.4,
        },
        relayer: {
          status: 'up',
          network: 'Base Sepolia',
          chainId: 84532,
          contractAddress: '0x165B47291B87569b91696DCE6f1207eE15C9f783',
          latestBlock: 18452300,
          blockTimestamp: 1728030600,
          latencyMs: 65,
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Database unavailable or critical subsystem failure',
  })
  async getHealth(@Res() res: Response) {
    const report = await this.healthService.checkHealth();
    const httpStatus =
      report.status === 'unhealthy'
        ? HttpStatus.SERVICE_UNAVAILABLE
        : HttpStatus.OK;

    return res.status(httpStatus).json(report);
  }
}
