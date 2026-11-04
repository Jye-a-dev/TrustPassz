import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class QueryAdminUsersDto {
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

  @ApiPropertyOptional({
    description: 'Exact or prefix search by userId, email, Solana Base58, or EVM 0x wallet address',
    example: '7nx... or 0x123... or user@example.com',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Filter segmentation: CUSTOMERS (excludes staff), STAFF (Admin & Arbitrator), or ALL',
    enum: ['CUSTOMERS', 'STAFF', 'ALL'],
  })
  @IsOptional()
  @IsString()
  type?: 'CUSTOMERS' | 'STAFF' | 'ALL';

  @ApiPropertyOptional({ description: 'Filter by frozen wallet status' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isFrozen?: boolean;
}

export class UpdateUserRoleDto {
  @ApiProperty({ enum: UserRole, example: UserRole.ARBITRATOR })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @ApiProperty({
    example: 'Phân quyền Trọng tài viên thụ lý giải quyết khiếu nại tranh chấp',
    minLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  auditReason: string;
}

export class ToggleFreezeUserDto {
  @ApiProperty({ example: true, description: 'True to freeze wallet, false to unfreeze' })
  @IsBoolean()
  @IsNotEmpty()
  isFrozen: boolean;

  @ApiProperty({
    example: 'Phát hiện hành vi gian lận cố ý vi phạm quy chuẩn thanh toán Escrow',
    minLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  auditReason: string;
}

