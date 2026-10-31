import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Min,
} from 'class-validator';

export class ConfirmFundingDto {
  @ApiProperty({
    description: 'Solana transaction signature (Base58 encoded hash)',
    example: '5K3y...Base58SignatureHere...9zQe',
  })
  @IsString({ message: 'txHash phải là chuỗi ký tự hợp lệ' })
  @IsNotEmpty({ message: 'txHash không được để trống' })
  @Matches(/^[1-9A-HJ-NP-za-km-z]{64,128}$/, {
    message: 'txHash phải là Solana Base58 signature hợp lệ (64-128 ký tự)',
  })
  txHash!: string;

  @ApiProperty({
    description: 'Địa chỉ ví Solana của Admin/Sender (Base58)',
    example: '7nxQL...senderPublicKey...XyZ',
  })
  @IsString({ message: 'senderWallet phải là chuỗi ký tự hợp lệ' })
  @IsNotEmpty({ message: 'senderWallet không được để trống' })
  @Matches(/^[1-9A-HJ-NP-za-km-z]{32,44}$/, {
    message: 'senderWallet phải là địa chỉ ví Solana Base58 hợp lệ',
  })
  senderWallet!: string;

  @ApiProperty({
    description: 'Số lượng SOL cấp vốn (SOL đơn vị thập phân)',
    example: 1.5,
    minimum: 0.000000001,
  })
  @IsNumber({}, { message: 'amountSol phải là số thực' })
  @IsPositive({ message: 'amountSol phải lớn hơn 0' })
  @Min(0.000000001, { message: 'Số SOL nạp tối thiểu là 1 Lamport (0.000000001 SOL)' })
  amountSol!: number;

  @ApiPropertyOptional({
    description: 'Mã xác thực 2 bước (2FA OTP/PIN gồm 6 chữ số)',
    example: '123456',
  })
  @IsOptional()
  @IsString({ message: 'twoFactorCode phải là chuỗi ký tự' })
  @Matches(/^\d{6}$/, {
    message: 'twoFactorCode phải là chuỗi 6 chữ số',
  })
  twoFactorCode?: string;
}

export class RelayerBalanceResponseDto {
  @ApiProperty({
    description: 'Địa chỉ ví Solana Relayer toàn cục hệ thống (Base58)',
    example: 'TrUsT11111111111111111111111111111111111111',
  })
  relayerAddress!: string;

  @ApiProperty({
    description: 'Số dư ví Relayer tính bằng SOL',
    example: 2.456,
  })
  balanceSol!: number;

  @ApiProperty({
    description: 'Số dư ví Relayer tính bằng Lamports (1 SOL = 10^9 Lamports)',
    example: '2456000000',
  })
  balanceLamports!: string;

  @ApiProperty({
    description: 'Ngưỡng cảnh báo cạn gas (SOL)',
    example: 0.1,
  })
  thresholdSol!: number;

  @ApiProperty({
    description: 'Cờ cảnh báo nếu số dư hiện tại < thresholdSol',
    example: false,
  })
  isLowBalance!: boolean;

  @ApiProperty({
    description: 'Tên mạng Solana (Cluster RPC)',
    example: 'devnet',
  })
  network!: string;

  @ApiProperty({
    description: 'Dấu thời gian ISO khi truy vấn',
    example: '2026-11-01T03:00:00.000Z',
  })
  timestamp!: string;
}

export class ConfirmFundingResponseDto {
  @ApiProperty({
    description: 'Trạng thái xác thực thành công',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'Thông báo kết quả',
    example: 'Xác thực và ghi nhận cấp vốn ví Solana Relayer thành công',
  })
  message!: string;

  @ApiProperty({
    description: 'Transaction signature trên Solana',
    example: '5K3y...Base58SignatureHere...9zQe',
  })
  txHash!: string;

  @ApiProperty({
    description: 'Số lượng SOL đã nạp',
    example: 1.5,
  })
  amountSol!: number;

  @ApiProperty({
    description: 'Số lượng Lamports đã nạp',
    example: '1500000000',
  })
  amountLamports!: string;

  @ApiProperty({
    description: 'Địa chỉ ví gửi (Super Admin)',
    example: '7nxQL...senderPublicKey...XyZ',
  })
  senderWallet!: string;

  @ApiProperty({
    description: 'Địa chỉ ví nhận (Relayer)',
    example: 'TrUsT11111111111111111111111111111111111111',
  })
  relayerAddress!: string;

  @ApiProperty({
    description: 'Số dư mới của ví Relayer sau khi nạp (SOL)',
    example: 3.956,
  })
  newBalanceSol!: number;

  @ApiProperty({
    description: 'Thời điểm ghi nhận vào cơ sở dữ liệu',
    example: '2026-11-01T03:00:00.000Z',
  })
  recordedAt!: string;
}

