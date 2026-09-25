import { ApiPropertyOptional } from '@nestjs/swagger';
import { DealState } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class QueryDealDto {
  @ApiPropertyOptional({
    description: 'Current page number for pagination',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be greater than or equal to 1' })
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page (maximum 100)',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter deals matching specific lifecycle state',
    enum: DealState,
    example: DealState.PENDING,
  })
  @IsOptional()
  @IsEnum(DealState, { message: 'Invalid deal state filter' })
  state?: DealState;

  @ApiPropertyOptional({
    description: 'Filter deals created by specific seller UUID',
    example: '11111111-1111-4111-a111-111111111111',
  })
  @IsOptional()
  @IsUUID(undefined, { message: 'Seller ID must be a valid UUID' })
  sellerId?: string;

  @ApiPropertyOptional({
    description: 'Filter deals designated for specific buyer UUID',
    example: '22222222-2222-4222-a222-222222222222',
  })
  @IsOptional()
  @IsUUID(undefined, { message: 'Buyer ID must be a valid UUID' })
  buyerId?: string;

  @ApiPropertyOptional({
    description: 'Case-insensitive full-text search string on title or description',
    example: 'source code',
  })
  @IsOptional()
  @IsString({ message: 'Search query must be a string' })
  search?: string;
}
