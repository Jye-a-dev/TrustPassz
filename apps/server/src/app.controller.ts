import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('System & Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Health check and service status ping',
    description:
      'Returns server operational message confirming system availability.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy and responding.',
    schema: {
      type: 'string',
      example: 'Hello World!',
    },
  })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('api/v1/health')
  @ApiOperation({
    summary: 'API v1 Health Check',
    description: 'Returns JSON status for mobile and infrastructure health pings.',
  })
  @ApiResponse({
    status: 200,
    description: 'Backend operational',
    schema: { example: { status: 'ok', service: 'TrustPassz Unified API' } },
  })
  getHealth() {
    return {
      status: 'ok',
      service: 'TrustPassz Unified API',
      timestamp: new Date().toISOString(),
    };
  }
}
