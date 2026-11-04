import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role, Roles } from '../../common/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';
import { TvlQueryDto } from './dto/analytics-query.dto';
import {
  AnalyticsOverviewResponse,
  DealDistributionItem,
  DisputeAiMetrics,
  TvlDataPoint,
  TvlTimeframe,
} from './interfaces/analytics.interface';

@ApiTags('Analytics & Financial Insights')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.ARBITRATOR)
@Controller('api/v1/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Get consolidated executive analytics and KPI overview',
    description:
      'Aggregates cumulative volume, locked TVL, deal lifecycle distribution, and AI dispute performance with 60s in-memory caching.',
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics overview loaded successfully',
  })
  async getOverview(
    @Query() query: TvlQueryDto,
  ): Promise<AnalyticsOverviewResponse> {
    const tf = (query.timeframe as TvlTimeframe) || '30d';
    return this.analyticsService.getOverview(tf);
  }

  @Get('tvl')
  @ApiOperation({
    summary: 'Get daily TVL and escrow transaction volume timeseries',
    description:
      'Timeseries aggregation separated by VND (PayOS) and ETH (Base Sepolia) over 7d, 30d, 90d, or all.',
  })
  @ApiResponse({
    status: 200,
    description: 'TVL timeseries data points retrieved successfully',
  })
  async getTvlTimeseries(@Query() query: TvlQueryDto): Promise<TvlDataPoint[]> {
    const tf = (query.timeframe as TvlTimeframe) || '30d';
    return this.analyticsService.getTvlTimeseries(tf);
  }

  @Get('deals/distribution')
  @ApiOperation({
    summary: 'Get lifecycle status breakdown across all deals',
  })
  @ApiResponse({
    status: 200,
    description: 'Deal state distribution retrieved successfully',
  })
  async getDealDistribution(): Promise<DealDistributionItem[]> {
    return this.analyticsService.getDealDistribution();
  }

  @Get('disputes/metrics')
  @ApiOperation({
    summary: 'Get AI Arbitrator performance and dispute resolution metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'AI dispute metrics retrieved successfully',
  })
  async getDisputeAiMetrics(): Promise<DisputeAiMetrics> {
    return this.analyticsService.getDisputeAiMetrics();
  }

  @Post('cache/invalidate')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Proactively flush analytics in-memory caches',
  })
  @ApiResponse({
    status: 200,
    description: 'Cache successfully invalidated',
  })
  invalidateCache(): { success: boolean; timestamp: string } {
    this.analyticsService.invalidateCache();
    return {
      success: true,
      timestamp: new Date().toISOString(),
    };
  }
}
