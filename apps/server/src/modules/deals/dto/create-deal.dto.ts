import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class EncryptedAssetDto {
  @ApiPropertyOptional({
    description: 'Type of digital vault asset',
    enum: AssetType,
    example: AssetType.SOURCE_CODE,
    default: AssetType.SOURCE_CODE,
  })
  @IsOptional()
  @IsEnum(AssetType, { message: 'Invalid asset type' })
  assetType?: AssetType = AssetType.SOURCE_CODE;

  @ApiProperty({
    description: 'Client-side AES-256-GCM ciphertext payload (Base64 encoded)',
    example: 'cipher_secret_payload_base64_encoded==',
  })
  @IsNotEmpty({ message: 'Encrypted content is required' })
  @IsString({ message: 'Encrypted content must be a string' })
  encryptedContent: string;

  @ApiProperty({
    description: 'AES-GCM Initialization Vector (12 or 16 bytes in Hex)',
    example: 'e4d29e7c3b9f4a120000000000000000',
  })
  @IsNotEmpty({ message: 'Encryption IV is required' })
  @IsString({ message: 'Encryption IV must be a string' })
  @MaxLength(64, { message: 'Encryption IV must not exceed 64 characters' })
  encryptionIv: string;

  @ApiProperty({
    description: 'AES-GCM Authentication Tag (16 bytes in Hex)',
    example: '9f8e7d6c5b4a32100000000000000000',
  })
  @IsNotEmpty({ message: 'Auth tag is required' })
  @IsString({ message: 'Auth tag must be a string' })
  @MaxLength(64, { message: 'Auth tag must not exceed 64 characters' })
  authTag: string;

  @ApiPropertyOptional({
    description: 'SHA-256 hash of original plaintext asset for client-side integrity audit',
    example:
      'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
  })
  @IsOptional()
  @IsString({ message: 'Content hash must be a string' })
  @MaxLength(64, { message: 'Content hash must not exceed 64 characters' })
  contentHash?: string;

  @ApiPropertyOptional({
    description: 'Original name of the uploaded digital asset file',
    example: 'trustpassz-escrow-v1.zip',
  })
  @IsOptional()
  @IsString({ message: 'File name must be a string' })
  @MaxLength(255, { message: 'File name must not exceed 255 characters' })
  fileName?: string;

  @ApiPropertyOptional({
    description: 'Total file size in bytes',
    example: 52428800,
  })
  @IsOptional()
  @IsInt({ message: 'File size must be an integer' })
  @Min(0, { message: 'File size cannot be negative' })
  @Type(() => Number)
  fileSizeBytes?: number;

  @ApiPropertyOptional({
    description: 'Maximum access/decryption attempts before vault locks permanently',
    example: 3,
    default: 1,
  })
  @IsOptional()
  @IsInt({ message: 'Max access limit must be an integer' })
  @Min(1, { message: 'Max access limit must be at least 1' })
  @Type(() => Number)
  maxAccessLimit?: number = 1;
}

export class CreateDealDto {
  @ApiProperty({
    description: 'UUID of the seller who creates the deal and owns the digital vault item',
    example: '11111111-1111-4111-a111-111111111111',
  })
  @IsNotEmpty({ message: 'Seller ID is required' })
  @IsUUID(undefined, { message: 'Seller ID must be a valid UUID' })
  sellerId: string;

  @ApiPropertyOptional({
    description: 'UUID of the designated buyer (optional at initial creation)',
    example: '22222222-2222-4222-a222-222222222222',
  })
  @IsOptional()
  @IsUUID(undefined, { message: 'Buyer ID must be a valid UUID' })
  buyerId?: string;

  @ApiProperty({
    description: 'Title of the escrow deal',
    example: 'Fullstack Escrow Marketplace Source Code',
  })
  @IsNotEmpty({ message: 'Title is required' })
  @IsString({ message: 'Title must be a string' })
  @MaxLength(255, { message: 'Title must not exceed 255 characters' })
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed scope, terms, and delivery specifications for the deal',
    example: 'Production-ready escrow system built on Base Sepolia and NestJS',
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @ApiProperty({
    description: 'Deal escrow valuation amount in specified currency',
    example: 500000,
  })
  @IsNotEmpty({ message: 'Amount is required' })
  @IsNumber(
    { maxDecimalPlaces: 4 },
    { message: 'Amount must be a number with up to 4 decimal places' },
  )
  @IsPositive({ message: 'Amount must be greater than zero' })
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({
    description: 'Settlement fiat or token currency symbol',
    example: 'VND',
    default: 'VND',
  })
  @IsOptional()
  @IsString({ message: 'Currency must be a string' })
  @MaxLength(10, { message: 'Currency must not exceed 10 characters' })
  currency?: string = 'VND';

  @ApiPropertyOptional({
    description: 'Inspection duration granted to buyer in seconds upon escrow funding (e.g. 43200s = 12h)',
    example: 43200,
    default: 86400,
  })
  @IsOptional()
  @IsInt({ message: 'Inspection duration must be an integer' })
  @IsPositive({ message: 'Inspection duration must be positive' })
  @Type(() => Number)
  inspectionDuration?: number = 86400;

  @ApiPropertyOptional({
    description: 'On-chain DigitalEscrow smart contract deal identifier or address',
    example: '0x1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d',
  })
  @IsOptional()
  @IsString({ message: 'Onchain deal ID must be a string' })
  @MaxLength(66, { message: 'Onchain deal ID must not exceed 66 characters' })
  onchainDealId?: string;

  @ApiPropertyOptional({
    description: 'Client-side AES-256-GCM encrypted payload package for Digital Vault',
    type: () => EncryptedAssetDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => EncryptedAssetDto)
  digitalAsset?: EncryptedAssetDto;
}
