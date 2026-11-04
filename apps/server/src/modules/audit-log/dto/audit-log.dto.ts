import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export enum AuditActionType {
  OVERRIDE_SETTLE = 'OVERRIDE_SETTLE',
  OVERRIDE_REFUND = 'OVERRIDE_REFUND',
  FREEZE_USER = 'FREEZE_USER',
  UNFREEZE_USER = 'UNFREEZE_USER',
  ROLE_CHANGE = 'ROLE_CHANGE',
  FUND_RELAYER = 'FUND_RELAYER',
  FIAT_CRYPTO_SWAP = 'FIAT_CRYPTO_SWAP',
}

export class CreateAuditLogDto {
  @ApiPropertyOptional({ example: 'a0000000-0000-4000-a000-000000000001' })
  @IsOptional()
  @IsUUID()
  adminId?: string;

  @ApiProperty({ enum: AuditActionType, example: AuditActionType.OVERRIDE_SETTLE })
  @IsEnum(AuditActionType)
  @IsNotEmpty()
  actionType: AuditActionType;

  @ApiProperty({ example: 'deal-uuid-or-user-uuid' })
  @IsString()
  @IsNotEmpty()
  targetEntityId: string;

  @ApiPropertyOptional({ example: { state: 'DISPUTED' } })
  @IsOptional()
  @IsObject()
  payloadBefore?: Record<string, unknown>;

  @ApiPropertyOptional({ example: { state: 'SETTLED' } })
  @IsOptional()
  @IsObject()
  payloadAfter?: Record<string, unknown>;

  @ApiProperty({ example: 'Trọng tài xác nhận người mua vi phạm thời hạn khiếu nại' })
  @IsString()
  @IsNotEmpty()
  auditReason: string;

  @ApiPropertyOptional({ example: '5KJ...solana-tx-hash' })
  @IsOptional()
  @IsString()
  txHash?: string;

  @ApiPropertyOptional({ example: '127.0.0.1' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ example: 'Mozilla/5.0 ...' })
  @IsOptional()
  @IsString()
  userAgent?: string;
}

export class QueryAuditLogDto {
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

  @ApiPropertyOptional({ enum: AuditActionType })
  @IsOptional()
  @IsEnum(AuditActionType)
  actionType?: AuditActionType;

  @ApiPropertyOptional({ example: 'a0000000-0000-4000-a000-000000000001' })
  @IsOptional()
  @IsUUID()
  adminId?: string;

  @ApiPropertyOptional({ example: 'target-id' })
  @IsOptional()
  @IsString()
  targetEntityId?: string;
}

