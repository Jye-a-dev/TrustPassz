import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';

/**
 * DTO for verifying an on-chain Solana deposit transaction signature against double-spend.
 */
export class VerifySolanaDepositDto {
  @ApiProperty({
    example: 'd0000000-0000-4000-a000-000000000001',
    description: 'UUID của Deal cần xác thực giao dịch nạp tiền ký quỹ',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'dealId phải là định dạng UUIDv4 hợp lệ' })
  @IsNotEmpty({ message: 'dealId không được để trống' })
  dealId: string;

  @ApiProperty({
    example:
      '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9dTeUMnjp5nhEDXejP8M47pXmGFnnU2L8w9C57X33sB4qD',
    description:
      'Transaction Signature (TxHash) ghi nhận trên mạng Solana (Base58, 64-88 ký tự)',
  })
  @IsString({ message: 'signature phải là chuỗi ký tự hợp lệ' })
  @IsNotEmpty({ message: 'signature không được để trống' })
  @Length(64, 88, {
    message: 'Solana signature có độ dài hợp lệ từ 64 đến 88 ký tự base58',
  })
  signature: string;
}

