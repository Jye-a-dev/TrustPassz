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
import { BargainStatus } from '@prisma/client';

export class CreateBargainDto {
  @ApiProperty({ example: '44444444-4444-4444-a444-444444444444', description: 'Product UUID' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: '22222222-2222-4222-a222-222222222222', description: 'Buyer User UUID' })
  @IsUUID()
  @IsNotEmpty()
  buyerId: string;

  @ApiProperty({ example: 850000, description: 'Proposed purchase price' })
  @IsNumber()
  @IsPositive()
  offeredPrice: number;

  @ApiPropertyOptional({ example: 24, default: 24, description: 'Offer validity duration in hours' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  validHours?: number = 24;

  @ApiPropertyOptional({
    example: { buyer_note: 'Can pay instantly via USDT or VNPay', ai_suggested: false },
    description: 'Negotiation notes and socket session details',
  })
  @IsOptional()
  @IsObject()
  negotiationData?: Record<string, unknown>;
}

export class RespondBargainDto {
  @ApiProperty({ enum: ['ACCEPTED', 'REJECTED'], example: 'ACCEPTED', description: 'Seller decision on proposed offer' })
  @IsEnum(['ACCEPTED', 'REJECTED'])
  @IsNotEmpty()
  status: 'ACCEPTED' | 'REJECTED';

  @ApiPropertyOptional({ example: 'Offer accepted, deal initialized.', description: 'Response note' })
  @IsOptional()
  @IsString()
  responseNote?: string;
}

export class QueryBargainDto {
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

  @ApiPropertyOptional({ example: '44444444-4444-4444-a444-444444444444' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ example: '22222222-2222-4222-a222-222222222222' })
  @IsOptional()
  @IsUUID()
  buyerId?: string;

  @ApiPropertyOptional({ enum: BargainStatus })
  @IsOptional()
  @IsEnum(BargainStatus)
  status?: BargainStatus;
}
