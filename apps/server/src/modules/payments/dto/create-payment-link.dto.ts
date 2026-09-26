import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreatePaymentLinkDto {
  @ApiPropertyOptional({
    example: 'd0000000-0000-4000-a000-000000000001',
    description: 'UUID của deal cần thanh toán (khi truyền qua request body)',
  })
  @IsOptional()
  @IsUUID()
  dealId?: string;

  @ApiPropertyOptional({
    example: 'https://trustpassz.io/checkout/success',
    description: 'URL chuyển hướng sau khi thanh toán VietQR thành công',
  })
  @IsOptional()
  @IsUrl()
  returnUrl?: string;

  @ApiPropertyOptional({
    example: 'https://trustpassz.io/checkout/cancel',
    description: 'URL chuyển hướng khi người mua hủy thanh toán',
  })
  @IsOptional()
  @IsUrl()
  cancelUrl?: string;

  @ApiPropertyOptional({
    example: 'Thanh toan deal',
    description:
      'Nội dung thanh toán hiển thị trên VietQR (tối đa 25 ký tự theo chuẩn PayOS)',
    maxLength: 25,
  })
  @IsOptional()
  @IsString()
  @MaxLength(25)
  description?: string;
}
