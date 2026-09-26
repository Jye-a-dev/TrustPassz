import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';

export class CreateStorefrontDto {
  @ApiProperty({ example: '11111111-1111-4111-a111-111111111111', description: 'Seller User UUID' })
  @IsUUID()
  @IsNotEmpty()
  sellerId: string;

  @ApiProperty({ example: 'alpha-vault', description: 'Storefront unique URL slug' })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug can only contain lowercase letters, numbers, and hyphens' })
  @Length(3, 50)
  slug: string;

  @ApiProperty({ example: 'Alpha Vault Official Store', description: 'Public storefront name' })
  @IsString()
  @Length(2, 100)
  shopName: string;

  @ApiPropertyOptional({ example: 'Verified digital software licenses and verified escrow assets', description: 'Store bio' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    example: { theme: 'dark', social_links: { twitter: 'https://x.com/alphavault' }, banner_url: null, canvas_layout: [] },
    description: 'Custom frontend store layout configuration',
  })
  @IsOptional()
  @IsObject()
  customConfig?: Record<string, unknown>;
}

export class UpdateStorefrontDto {
  @ApiPropertyOptional({ example: 'alpha-vault-pro', description: 'Updated storefront slug' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug can only contain lowercase letters, numbers, and hyphens' })
  slug?: string;

  @ApiPropertyOptional({ example: 'Alpha Vault Pro Store', description: 'Updated storefront name' })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  shopName?: string;

  @ApiPropertyOptional({ example: 'Premium escrow verified source code and accounts', description: 'Updated bio' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    example: { theme: 'light', banner_url: 'https://trustpassz.io/banners/alpha.png' },
    description: 'Updated store configuration',
  })
  @IsOptional()
  @IsObject()
  customConfig?: Record<string, unknown>;
}
