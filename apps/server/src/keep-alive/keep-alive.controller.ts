import { Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { KeepAliveService } from './keep-alive.service';

@ApiTags('System & Health')
@SkipThrottle()
@Controller('api/v1/keep-alive')
export class KeepAliveController {
  constructor(private readonly keepAliveService: KeepAliveService) {}

  @Public()
  @Get('status')
  @ApiOperation({
    summary: 'Get last keep-alive anti-idle cycle status',
    description:
      'Returns the latest metrics from Neon PostgreSQL query and health worker pings.',
  })
  @ApiResponse({
    status: 200,
    description: 'Latest keep-alive report retrieved.',
  })
  getStatus() {
    return {
      status: 'active',
      report: this.keepAliveService.getLastReport() || {
        status: 'pending_first_cycle',
      },
    };
  }

  @Public()
  @Post('trigger')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Manually trigger keep-alive cycle',
    description:
      'Forces an immediate lightweight query to Neon DB and health check probe.',
  })
  @ApiResponse({
    status: 200,
    description: 'Keep-alive cycle executed manually.',
  })
  async triggerCycle() {
    const report = await this.keepAliveService.executeKeepAliveCycle();
    return {
      status: 'executed',
      report,
    };
  }
}

