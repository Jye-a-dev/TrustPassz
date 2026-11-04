import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response schema for VietQR checkout link generation.
 */
export class VietQrCheckoutResponseDto {
  @ApiProperty({
    example:
      'https://img.vietqr.io/image/970422-998877-compact2.png?amount=500000&addInfo=TPZ%20d0000000&accountName=TRUSTPASSZ%20ESCROW',
    description: 'URL ảnh mã VietQR động chuẩn NAPAS 247',
  })
  qrCodeUrl: string;

  @ApiProperty({
    example: 'https://pay.payos.vn/web/88990011',
    description: 'Đường dẫn cổng thanh toán PayOS Checkout',
  })
  paymentUrl: string;

  @ApiProperty({
    example: 88990011,
    description: 'Mã đơn hàng định danh duy nhất (Safe Integer)',
  })
  orderCode: number;

  @ApiProperty({
    example: 500000,
    description: 'Số tiền nạp ký quỹ (VND)',
  })
  amount: number;

  @ApiProperty({
    example: 'TPZ d0000000',
    description: 'Cú pháp nội dung chuyển khoản định danh tự động',
  })
  memo: string;

  @ApiPropertyOptional({
    example: '970422',
    description: 'Mã BIN ngân hàng thụ hưởng MBBank Escrow',
  })
  bin?: string;

  @ApiPropertyOptional({
    example: '998877',
    description: 'Số tài khoản két ký quỹ hệ thống TrustPassz',
  })
  accountNumber?: string;

  @ApiPropertyOptional({
    example: 'TRUSTPASSZ ESCROW',
    description: 'Tên chủ tài khoản ngân hàng thụ hưởng',
  })
  accountName?: string;

  @ApiPropertyOptional({
    example: 'PENDING',
    description: 'Trạng thái phiên thanh toán khởi tạo',
  })
  status?: string;
}

/**
 * Response schema for Solana deposit session intent.
 */
export class SolanaIntentResponseDto {
  @ApiProperty({
    example: 'TrUsTEscrow111111111111111111111111111111111',
    description:
      'Địa chỉ Escrow PDA hoặc ví tiếp nhận tiền ký quỹ on-chain của hệ thống',
  })
  recipientAddress: string;

  @ApiProperty({
    example: 0.05,
    description: 'Số lượng SOL cần chuyển để đủ giá trị đặt cọc',
  })
  requiredSol: number;

  @ApiProperty({
    example: '50000000',
    description: 'Số lượng Lamports tương ứng (1 SOL = 1,000,000,000 Lamports)',
  })
  requiredLamports: string;

  @ApiProperty({
    example: 'TPZ-SOL-d0000000-0000-4000-a000-000000000001',
    description:
      'Memo định danh giao dịch nạp tiền độc nhất để đối soát on-chain',
  })
  referenceMemo: string;

  @ApiProperty({
    example: '2026-11-01T02:30:00.000Z',
    description: 'Thời điểm hết hạn hiệu lực của phiên nạp tiền (ISO 8601)',
  })
  expiresAt: string;
}

/**
 * Response schema for Solana transaction signature verification.
 */
export class SolanaVerifyResponseDto {
  @ApiProperty({
    example: true,
    description: 'Trạng thái xác thực giao dịch on-chain thành công',
  })
  success: boolean;

  @ApiProperty({
    example:
      '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9dTeUMnjp5nhEDXejP8M47pXmGFnnU2L8w9C57X33sB4qD',
    description: 'Solana Transaction Signature (TxHash) đã đối soát',
  })
  txHash: string;

  @ApiProperty({
    example: 'DEPOSITED',
    description: 'Trạng thái Deal sau khi kích hoạt ký quỹ thành công',
  })
  status: string;

  @ApiProperty({
    example: '2026-11-01T02:05:00.000Z',
    description: 'Thời điểm giao dịch được xác thực và cập nhật DB (ISO 8601)',
  })
  confirmedAt: string;

  @ApiPropertyOptional({
    example: 312456789,
    description: 'Solana Slot number xác nhận giao dịch',
  })
  slot?: number;
}

/**
 * Response schema for Deal deposit status check.
 */
export class DepositStatusResponseDto {
  @ApiProperty({
    example: 'd0000000-0000-4000-a000-000000000001',
    description: 'UUID của Deal',
  })
  dealId: string;

  @ApiProperty({
    example: 'DEPOSITED',
    description: 'Trạng thái hiện tại của Deal trong quy trình Escrow',
  })
  state: string;

  @ApiProperty({
    example: 'VND',
    description: 'Đơn vị tiền tệ của Deal (VND hoặc SOL)',
  })
  currency: string;

  @ApiProperty({
    example: 500000,
    description: 'Giá trị nạp tiền ký quỹ của Deal',
  })
  amount: number;

  @ApiPropertyOptional({
    example: '2026-11-01T02:05:00.000Z',
    description: 'Thời điểm tiền cọc được ghi nhận thành công',
    nullable: true,
  })
  depositedAt: string | null;

  @ApiPropertyOptional({
    example:
      '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9dTeUMnjp5nhEDXejP8M47pXmGFnnU2L8w9C57X33sB4qD',
    description: 'TxHash giao dịch on-chain (nếu nạp qua Solana)',
    nullable: true,
  })
  depositTxHash: string | null;

  @ApiPropertyOptional({
    example: 88990011,
    description: 'Mã đơn hàng PayOS (nếu nạp qua VietQR)',
    nullable: true,
  })
  paymentOrderCode: number | null;

  @ApiPropertyOptional({
    example: 'FT240926001234',
    description: 'Mã tham chiếu ngân hàng (nếu nạp qua VietQR)',
    nullable: true,
  })
  paymentRefId: string | null;

  @ApiPropertyOptional({
    example: 'VIETQR',
    description: 'Kênh nạp tiền phát hiện (VIETQR | SOLANA | ONCHAIN)',
    nullable: true,
  })
  channel: string | null;

  @ApiPropertyOptional({
    example: 'TrUsTEscrow111111111111111111111111111111111',
    description: 'Địa chỉ ví Escrow PDA Solana gắn với Deal',
    nullable: true,
  })
  solanaPdaAddress: string | null;
}

