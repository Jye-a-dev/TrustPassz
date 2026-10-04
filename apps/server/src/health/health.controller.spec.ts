import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService, HealthResponsePayload } from './health.service';
import type { Response } from 'express';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: HealthService;

  const mockHealthyPayload: HealthResponsePayload = {
    status: 'healthy',
    service: 'TrustPassz Unified API',
    version: '1.0.0',
    environment: 'test',
    timestamp: new Date().toISOString(),
    uptimeSeconds: 100,
    database: {
      status: 'up',
      provider: 'Neon PostgreSQL (pgBouncer Pool)',
      latencyMs: 10,
    },
    memory: {
      status: 'up',
      rssMB: 80,
      heapTotalMB: 60,
      heapUsedMB: 40,
      heapUsedPercent: 66.7,
    },
    relayer: {
      status: 'up',
      network: 'Base Sepolia',
      chainId: 84532,
      contractAddress: '0x165B47291B87569b91696DCE6f1207eE15C9f783',
      latestBlock: 1234567,
      blockTimestamp: 1728390000,
      latencyMs: 40,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: {
            checkHealth: jest.fn().mockResolvedValue(mockHealthyPayload),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthService = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return HTTP 200 with complete telemetry payload when system is healthy', async () => {
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;

    await controller.getHealth(mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(mockRes.json).toHaveBeenCalledWith(mockHealthyPayload);
  });

  it('should return HTTP 503 when database is down', async () => {
    const unhealthyPayload: HealthResponsePayload = {
      ...mockHealthyPayload,
      status: 'unhealthy',
      database: {
        status: 'down',
        provider: 'Neon PostgreSQL (pgBouncer Pool)',
        latencyMs: 50,
        error: 'Connection timeout',
      },
    };

    jest.spyOn(healthService, 'checkHealth').mockResolvedValue(unhealthyPayload);

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;

    await controller.getHealth(mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    expect(mockRes.json).toHaveBeenCalledWith(unhealthyPayload);
  });
});
