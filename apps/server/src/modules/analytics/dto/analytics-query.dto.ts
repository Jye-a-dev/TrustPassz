import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import type { TvlTimeframe } from '../interfaces/analytics.interface';

export class TvlQueryDto {
  @ApiPropertyOptional({
    description: 'Timeframe filter for TVL and Escrow timeseries aggregation',
    enum: ['7d', '30d', '90d', 'all'],
    default: '30d',
    example: '30d',
  })
  @IsOptional()
  @IsString()
  @IsIn(['7d', '30d', '90d', 'all'], {
    message: 'Timeframe must be one of: 7d, 30d, 90d, all',
  })
  timeframe?: string = '30d';

  @ApiPropertyOptional({
    description: 'Target currency filter',
    enum: ['VND', 'ETH', 'ALL'],
    default: 'ALL',
    example: 'ALL',
  })
  @IsOptional()
  @IsString()
  @IsIn(['VND', 'ETH', 'ALL'], {
    message: 'Currency filter must be one of: VND, ETH, ALL',
  })
  currency?: string = 'ALL';
}
