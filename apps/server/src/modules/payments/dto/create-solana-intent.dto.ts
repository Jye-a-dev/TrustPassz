import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

/**
 * DTO for generating an on-chain Solana escrow deposit session intent.
 */
export class CreateSolanaIntentDto {
  @ApiProperty({
    example: 'd0000000-0000-4000-a000-000000000001',
    description: 'UUID của Deal cần tạo phiên nạp tiền ký quỹ Solana on-chain',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'dealId phải là định dạng UUIDv4 hợp lệ' })
  @IsNotEmpty({ message: 'dealId không được để trống' })
  dealId: string;
}

