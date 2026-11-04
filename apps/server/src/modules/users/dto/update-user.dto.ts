import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'seller@trustpassz.io',
    description: 'Updated email address',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: '+84987654321',
    description: 'Contact phone number',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: '0x1111111111111111111111111111111111111111 or F9zXgYmojDjHnjiRCtNLb46ruUorjrWeEDBxF2dFkJjn',
    description: 'EVM 0x or Solana Base58 compatible wallet address',
  })
  @IsOptional()
  @Matches(/(^0x[a-fA-F0-9]{40}$)|(^[1-9A-HJ-NP-za-km-z]{32,44}$)/, {
    message: 'walletAddress must be a valid 42-character EVM address or 32-44 character Solana Base58 public key',
  })
  walletAddress?: string;

  @ApiPropertyOptional({
    example: 'Trusted Merchant',
    description: 'User display alias',
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  displayName?: string;

  @ApiPropertyOptional({
    example: 'https://trustpassz.io/avatars/merchant.png',
    description: 'Public avatar URL',
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    example: 'USER',
    description: 'Assigned platform role',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
