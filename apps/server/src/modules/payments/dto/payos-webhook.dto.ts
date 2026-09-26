import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class PayOSWebhookDataDto {
  @ApiProperty({
    example: 88990011,
    description: 'Mã đơn hàng PayOS sinh ra cho giao dịch',
  })
  @IsNumber()
  @IsNotEmpty()
  orderCode: number;

  @ApiProperty({
    example: 500000,
    description: 'Số tiền thanh toán thực tế (VND)',
  })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    example: 'Deal Escrow Payment',
    description: 'Nội dung chuyển khoản PayOS',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: '998877',
    description: 'Số tài khoản nhận tiền PayOS',
  })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty({
    example: 'FT240926001234',
    description:
      'Mã tham chiếu giao dịch ngân hàng (Dùng làm Idempotency Key chống Replay Attack)',
  })
  @IsString()
  @IsNotEmpty()
  reference: string;

  @ApiProperty({
    example: '2026-09-26 14:30:00',
    description: 'Thời gian giao dịch hoàn tất',
  })
  @IsString()
  @IsNotEmpty()
  transactionDateTime: string;

  @ApiProperty({
    example: 'VND',
    description: 'Đơn vị tiền tệ giao dịch',
  })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({
    example: 'pl_88990011',
    description: 'ID link thanh toán PayOS',
  })
  @IsString()
  @IsNotEmpty()
  paymentLinkId: string;

  @ApiProperty({
    example: '00',
    description: 'Mã trạng thái giao dịch từ cổng thanh toán (00 = Thành công)',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    example: 'Success',
    description: 'Mô tả trạng thái giao dịch',
  })
  @IsString()
  @IsNotEmpty()
  desc: string;

  @ApiPropertyOptional({
    example: '970422',
    description: 'Mã ngân hàng người chuyển tiền (BIN)',
  })
  @IsOptional()
  @IsString()
  counterAccountBankId?: string | null;

  @ApiPropertyOptional({
    example: 'MBBank',
    description: 'Tên ngân hàng người chuyển',
  })
  @IsOptional()
  @IsString()
  counterAccountBankName?: string | null;

  @ApiPropertyOptional({
    example: 'NGUYEN VAN A',
    description: 'Tên chủ tài khoản người chuyển',
  })
  @IsOptional()
  @IsString()
  counterAccountName?: string | null;

  @ApiPropertyOptional({
    example: '0123456789',
    description: 'Số tài khoản người chuyển',
  })
  @IsOptional()
  @IsString()
  counterAccountNumber?: string | null;

  @ApiPropertyOptional({
    example: null,
    description: 'Tên tài khoản ảo (Virtual Account)',
  })
  @IsOptional()
  @IsString()
  virtualAccountName?: string | null;

  @ApiPropertyOptional({
    example: null,
    description: 'Số tài khoản ảo (Virtual Account)',
  })
  @IsOptional()
  @IsString()
  virtualAccountNumber?: string | null;
}

export class PayOSWebhookDto {
  @ApiProperty({
    example: '00',
    description: 'Mã phản hồi tổng thể của webhook PayOS (00 = Thành công)',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    example: 'Success',
    description: 'Mô tả phản hồi tổng thể webhook',
  })
  @IsString()
  @IsNotEmpty()
  desc: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Trạng thái thành công của webhook event',
  })
  @IsOptional()
  @IsBoolean()
  success?: boolean;

  @ApiProperty({
    type: PayOSWebhookDataDto,
    description: 'Dữ liệu giao dịch chi tiết từ PayOS',
  })
  @ValidateNested()
  @Type(() => PayOSWebhookDataDto)
  @IsNotEmpty()
  data: PayOSWebhookDataDto;

  @ApiProperty({
    example:
      'c131d9430f59fced8551be1b4c818738a90b310a875f08d232787a4b7e1c7cf6',
    description:
      'Chữ ký HMAC-SHA256 bảo mật xác thực payload không bị sửa đổi',
  })
  @IsString()
  @IsNotEmpty()
  signature: string;
}
