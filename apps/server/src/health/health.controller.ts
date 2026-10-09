import { Controller, Get, HttpStatus, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
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
    summary: 'Optimized Health & Infrastructure Check',
    description:
      'Ultra-fast liveness probe (< 500ms, zero DB/RPC overhead) by default for Render cold-start prevention and UptimeRobot. Pass query ?deep=true to execute full DB pool and Base Sepolia block state verification.',
  })
  @ApiQuery({
    name: 'deep',
    required: false,
    type: Boolean,
    description:
      'When true, probes Neon PostgreSQL database and Base Sepolia on-chain status',
  })
  @ApiResponse({
    status: 200,
    description: 'System healthy (lightweight liveness or deep probe passed)',
    schema: {
      example: {
        status: 'healthy',
        service: 'TrustPassz Unified API',
        version: '1.0.0',
        environment: 'production',
        timestamp: '2026-10-09T08:30:00.000Z',
        uptimeSeconds: 1420.5,
        mode: 'lightweight',
        memory: {
          status: 'up',
          rssMB: 94.2,
          heapTotalMB: 65.5,
          heapUsedMB: 48.1,
          heapUsedPercent: 73.4,
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description:
      'Database unavailable or critical subsystem failure during deep probe',
  })
  async getHealth(
    @Res() res: Response,
    @Query('deep') deep?: string,
  ) {
    const isDeep = deep === 'true' || deep === '1';
    const report = await this.healthService.checkHealth(isDeep);
    const httpStatus =
      report.status === 'unhealthy'
        ? HttpStatus.SERVICE_UNAVAILABLE
        : HttpStatus.OK;

    return res.status(httpStatus).json(report);
  }
}
