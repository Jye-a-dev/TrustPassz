import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum FiatCurrency {
  VND = 'VND',
  USD = 'USD',
}

export enum FiatFundingStatusEnum {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FULFILLED = 'FULFILLED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export class CreateFiatOrderDto {
  @ApiProperty({
    example: 'F9zXgYmojDjHnjiRCtNLb46ruUorjrWeEDBxF2dFkJjn',
    description: 'Solana destination wallet address (Relayer or User)',
  })
  @IsString()
  @IsNotEmpty()
  recipientWallet: string;

  @ApiProperty({
    example: 450000,
    description: 'Fiat amount to fund (e.g., 450,000 VND or 20 USD)',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  fiatAmount: number;

  @ApiPropertyOptional({
    enum: FiatCurrency,
    default: FiatCurrency.VND,
    example: FiatCurrency.VND,
  })
  @IsOptional()
  @IsEnum(FiatCurrency)
  fiatCurrency?: FiatCurrency = FiatCurrency.VND;
}

export class FiatWebhookDto {
  @ApiProperty({ example: 123456789 })
  @IsNotEmpty()
  orderCode: number | string;

  @ApiPropertyOptional({ example: 450000 })
  @IsOptional()
  @Type(() => Number)
  amount?: number;

  @ApiPropertyOptional({ example: 'PAID' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'PAYOS-REF-9988' })
  @IsOptional()
  @IsString()
  paymentRefId?: string;
}

export class QueryFiatOrderDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: FiatFundingStatusEnum })
  @IsOptional()
  @IsEnum(FiatFundingStatusEnum)
  status?: FiatFundingStatusEnum;
}

