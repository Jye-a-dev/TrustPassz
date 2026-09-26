import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ProductStatus } from '@prisma/client';

export class CreateProductDto {
  @ApiProperty({ example: '11111111-1111-4111-a111-111111111111', description: 'Seller UUID' })
  @IsUUID()
  @IsNotEmpty()
  sellerId: string;

  @ApiPropertyOptional({ example: '33333333-3333-4333-a333-333333333333', description: 'Storefront UUID' })
  @IsOptional()
  @IsUUID()
  storefrontId?: string;

  @ApiProperty({ example: 'Verified E-Commerce Bot Source Code', description: 'Product title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'SOURCE_CODE', description: 'Product category' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 1200000, description: 'Base listing price' })
  @IsNumber()
  @IsPositive()
  basePrice: number;

  @ApiPropertyOptional({ example: 950000, description: 'Floor price for auto-bargain acceptance' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  floorPrice?: number;

  @ApiPropertyOptional({ example: 'VND', default: 'VND', description: 'Price currency symbol' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ enum: ProductStatus, default: 'ACTIVE', description: 'Initial product status' })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({
    example: { tags: ['bot', 'automation'], media_gallery: [], delivery_method: 'INSTANT_VAULT' },
    description: 'Product specifications and media assets',
  })
  @IsOptional()
  @IsObject()
  specAttributes?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: { inspection_hours: 24, allow_bargain: true, anti_boom_deposit_amount: 50000 },
    description: 'Escrow rules and bargain configuration',
  })
  @IsOptional()
  @IsObject()
  ruleConfig?: Record<string, unknown>;
}

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Updated Source Code License v2' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'SOFTWARE_LICENSE' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 1500000 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  basePrice?: number;

  @ApiPropertyOptional({ example: 1100000 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  floorPrice?: number;

  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  specAttributes?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  ruleConfig?: Record<string, unknown>;
}

export class QueryProductDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'SOURCE_CODE' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ example: '11111111-1111-4111-a111-111111111111' })
  @IsOptional()
  @IsUUID()
  sellerId?: string;

  @ApiPropertyOptional({ example: 'Bot' })
  @IsOptional()
  @IsString()
  search?: string;
}
