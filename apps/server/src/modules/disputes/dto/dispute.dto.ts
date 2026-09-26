import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ArbitrationVerdict, DisputeStatus } from '@prisma/client';

export class OpenDisputeDto {
  @ApiProperty({ example: 'd0000000-0000-4000-a000-000000000001', description: 'Escrow Deal UUID' })
  @IsUUID()
  @IsNotEmpty()
  dealId: string;

  @ApiProperty({ example: '22222222-2222-4222-a222-222222222222', description: 'User initiating dispute (Buyer or Seller)' })
  @IsUUID()
  @IsNotEmpty()
  initiatorId: string;

  @ApiProperty({
    example: 'Asset delivered is incomplete: missing installation script and credentials are invalid.',
    description: 'Detailed description of the claim',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({
    example: [
      'https://supabase.trustpassz.io/storage/v1/object/public/evidences/screenshot-1.png',
      'https://supabase.trustpassz.io/storage/v1/object/public/evidences/logs.txt',
    ],
    description: 'URLs to evidence files in Supabase Storage',
  })
  @IsOptional()
  @IsArray()
  evidenceUrls?: string[];
}

export class ResolveDisputeDto {
  @ApiProperty({ example: '33333333-3333-3333-a333-333333333333', description: 'Arbitrator or Admin User UUID' })
  @IsUUID()
  @IsNotEmpty()
  resolvedById: string;

  @ApiProperty({ enum: ArbitrationVerdict, example: 'TRIGGER_REFUND', description: 'Binding dispute resolution verdict' })
  @IsEnum(ArbitrationVerdict)
  @IsNotEmpty()
  adminVerdict: ArbitrationVerdict;

  @ApiProperty({
    example: 'Inspection evidence proves defective asset. Full refund approved to buyer.',
    description: 'Written arbitration rationale',
  })
  @IsString()
  @IsNotEmpty()
  resolutionNote: string;
}

export class QueryDisputeDto {
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

  @ApiPropertyOptional({ enum: DisputeStatus })
  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;

  @ApiPropertyOptional({ example: 'd0000000-0000-4000-a000-000000000001' })
  @IsOptional()
  @IsUUID()
  dealId?: string;
}
