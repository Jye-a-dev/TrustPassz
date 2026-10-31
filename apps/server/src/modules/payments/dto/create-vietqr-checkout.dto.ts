import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from 'class-validator';

/**
 * DTO for initiating dynamic VietQR checkout session via PayOS gateway.
 */
export class CreateVietQrCheckoutDto {
  @ApiProperty({
    example: 'd0000000-0000-4000-a000-000000000001',
    description: 'UUID của Deal ký quỹ Escrow cần thanh toán đặt cọc',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'dealId phải là định dạng UUIDv4 hợp lệ' })
  @IsNotEmpty({ message: 'dealId không được để trống' })
  dealId: string;

  @ApiPropertyOptional({
    example: 'https://trustpassz.io/checkout/success',
    description: 'URL chuyển hướng sau khi hoàn tất giao dịch ngân hàng',
  })
  @IsOptional()
  @IsUrl({}, { message: 'returnUrl phải là URL hợp lệ' })
  returnUrl?: string;

  @ApiPropertyOptional({
    example: 'https://trustpassz.io/checkout/cancel',
    description: 'URL chuyển hướng khi người mua hủy thanh toán',
  })
  @IsOptional()
  @IsUrl({}, { message: 'cancelUrl phải là URL hợp lệ' })
  cancelUrl?: string;

  @ApiPropertyOptional({
    example: 'TPZ d0000000',
    description:
      'Nội dung chuyển khoản hiển thị trên VietQR (tối đa 25 ký tự theo quy định PayOS)',
    maxLength: 25,
  })
  @IsOptional()
  @IsString()
  @MaxLength(25, { message: 'description tối đa 25 ký tự' })
  description?: string;
}

