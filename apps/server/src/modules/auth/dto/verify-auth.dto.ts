import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class VerifyAuthDto {
  @ApiPropertyOptional({
    description: 'OAuth ID token (Google) or Passkey Auth Token (Privy)',
    example:
      'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhdWQiOiJ5b3VyLWNsaWVudC1pZCIsImVtYWlsIjoic2VsbGVyQHRydXN0cGFzc3ouaW8iLCJzdWIiOiIxMTExMTExMTExMTExMTExMTExMTEifQ.signature',
  })
  @IsOptional()
  @IsString({ message: 'Token must be a string' })
  token?: string;

  @ApiPropertyOptional({
    description: 'Google OAuth ID Token alias',
    example:
      'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhdWQiOiJ5b3VyLWNsaWVudC1pZCIsImVtYWlsIjoic2VsbGVyQHRydXN0cGFzc3ouaW8iLCJzdWIiOiIxMTExMTExMTExMTExMTExMTExMTEifQ.signature',
  })
  @IsOptional()
  @IsString({ message: 'idToken must be a string' })
  idToken?: string;

  @ApiPropertyOptional({
    description: 'Authentication provider name',
    enum: ['google', 'privy', 'solana'],
    example: 'google',
    default: 'google',
  })
  @IsOptional()
  @IsString({ message: 'Provider must be a string' })
  provider?: 'google' | 'privy' | 'solana';

  @ApiPropertyOptional({
    description: 'Solana Public Key (Base58 encoded wallet address)',
    example: '7S3P4HxJPyqT9jHhWb1U2t1P7Z3qEKnP7XYZ8881234',
  })
  @IsOptional()
  @IsString({ message: 'Solana public key must be a string' })
  solanaPublicKey?: string;

  @ApiPropertyOptional({
    description: 'Solana Signature (Base58 or Hex encoded signature)',
    example: '5J4k...',
  })
  @IsOptional()
  @IsString({ message: 'Solana signature must be a string' })
  solanaSignature?: string;

  @ApiPropertyOptional({
    description: 'Solana Nonce Message used for signing verification',
    example:
      'TrustPassz Authentication: Sign this message to verify ownership of your wallet. Nonce: abc123xyz',
  })
  @IsOptional()
  @IsString({ message: 'Solana message must be a string' })
  solanaMessage?: string;

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
    description: 'User password for traditional credentials authentication',
    example: '123123',
  })
  @IsOptional()
  @IsString({ message: 'Password must be a string' })
  password?: string;

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
