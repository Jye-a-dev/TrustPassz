import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyAuthDto {
  @ApiProperty({
    description: 'OAuth ID token (Google) or Passkey Auth Token (Privy)',
    example:
      'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhdWQiOiJ5b3VyLWNsaWVudC1pZCIsImVtYWlsIjoic2VsbGVyQHRydXN0cGFzc3ouaW8iLCJzdWIiOiIxMTExMTExMTExMTExMTExMTExMTEifQ.signature',
  })
  @IsNotEmpty({ message: 'Token is required' })
  @IsString({ message: 'Token must be a string' })
  token: string;

  @ApiPropertyOptional({
    description: 'Authentication provider name',
    enum: ['google', 'privy'],
    example: 'google',
    default: 'google',
  })
  @IsOptional()
  @IsString({ message: 'Provider must be a string' })
  provider?: string;

  @ApiPropertyOptional({
    description: 'EVM Wallet Address associated with Privy passkey user',
    example: '0x1111111111111111111111111111111111111111',
  })
  @IsOptional()
  @IsString({ message: 'Wallet address must be a string' })
  walletAddress?: string;

  @ApiPropertyOptional({
    description: 'Email address of the authenticated user',
    example: 'seller@trustpassz.io',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Display name of user',
    example: 'Trusted Seller',
  })
  @IsOptional()
  @IsString({ message: 'Display name must be a string' })
  displayName?: string;

  @ApiPropertyOptional({
    description: 'Profile avatar picture URL',
    example: 'https://trustpassz.io/avatars/seller.png',
  })
  @IsOptional()
  @IsString({ message: 'Avatar URL must be a string' })
  avatarUrl?: string;
}
