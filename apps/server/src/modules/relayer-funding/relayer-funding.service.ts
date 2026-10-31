import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  ParsedInstruction,
  PartiallyDecodedInstruction,
  PublicKey,
} from '@solana/web3.js';
import bs58 from 'bs58';
import { PrismaService } from '../../database/prisma.service';
import { RequestUser } from '../../common/decorators/current-user.decorator';
import {
  ConfirmFundingDto,
  ConfirmFundingResponseDto,
  RelayerBalanceResponseDto,
} from './dto/relayer-funding.dto';

interface SystemTransferInfo {
  source: string;
  destination: string;
  lamports: number | bigint;
}

@Injectable()
export class RelayerFundingService implements OnModuleInit {
  private readonly logger = new Logger(RelayerFundingService.name);
  private connection!: Connection;
  private relayerPublicKey!: PublicKey;
  private alertThresholdSol = 0.1;
  private networkName = 'devnet';

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit(): void {
    const rpcUrl =
      this.configService.get<string>('SOLANA_RPC_URL') ||
      'https://api.devnet.solana.com';
    this.connection = new Connection(rpcUrl, 'confirmed');

    if (rpcUrl.includes('mainnet')) {
      this.networkName = 'mainnet-beta';
    } else if (rpcUrl.includes('testnet')) {
      this.networkName = 'testnet';
    } else {
      this.networkName = 'devnet';
    }

    const threshold = parseFloat(
      this.configService.get<string>('ALERT_THRESHOLD_SOL') ?? '0.1',
    );
    this.alertThresholdSol = Number.isNaN(threshold) ? 0.1 : threshold;

    let pubKeyStr = this.configService.get<string>('SOLANA_RELAYER_PUBLIC_KEY');
    if (!pubKeyStr || pubKeyStr.trim().length === 0) {
      const relayerSecret = this.configService.get<string>(
        'SOLANA_RELAYER_PRIVATE_KEY',
      );
      if (relayerSecret) {
        try {
          const decoded = bs58.decode(relayerSecret.trim());
          const keypair = Keypair.fromSecretKey(decoded);
          pubKeyStr = keypair.publicKey.toBase58();
        } catch {
          pubKeyStr = 'TrUsT11111111111111111111111111111111111111';
        }
      } else {
        pubKeyStr = 'TrUsT11111111111111111111111111111111111111';
      }
    }

    try {
      this.relayerPublicKey = new PublicKey(pubKeyStr.trim());
    } catch {
      this.relayerPublicKey = new PublicKey(
        'TrUsT11111111111111111111111111111111111111',
      );
    }

    this.logger.log(
      `[RelayerFundingService] Initialized — Relayer: ${this.relayerPublicKey.toBase58()} | Network: ${this.networkName} | Threshold: ${this.alertThresholdSol} SOL`,
    );
  }

  /**
   * Retrieves real-time SOL balance and Lamports for global Solana Relayer wallet.
   */
  async getRelayerBalance(): Promise<RelayerBalanceResponseDto> {
    try {
      const lamports = await this.connection.getBalance(
        this.relayerPublicKey,
        'confirmed',
      );
      const balanceSol = Number(
        (lamports / LAMPORTS_PER_SOL).toFixed(9),
      );

      return {
        relayerAddress: this.relayerPublicKey.toBase58(),
        balanceSol,
        balanceLamports: lamports.toString(),
        thresholdSol: this.alertThresholdSol,
        isLowBalance: balanceSol < this.alertThresholdSol,
        network: this.networkName,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to query Solana balance: ${msg}`);
      throw new BadRequestException(
        `Không thể kết nối Solana RPC để đọc số dư ví Relayer: ${msg}`,
      );
    }
  }

  /**
   * Verifies on-chain transaction signature, validates recipient, amount, 2FA, and logs funding atomically.
   */
  async verifyAndRecordFunding(
    dto: ConfirmFundingDto,
    adminUser?: RequestUser,
  ): Promise<ConfirmFundingResponseDto> {
    // 1. Two-Factor Authentication Check
    this.verifyTwoFactor(dto.twoFactorCode);

    // 2. Idempotency Check: Prevent replay attack
    await this.assertTransactionNotRecorded(dto.txHash);

    // 3. Query Solana RPC for confirmed transaction
    const parsedTx = await this.fetchParsedTransaction(dto.txHash);

    if (parsedTx.meta?.err) {
      throw new BadRequestException(
        `Giao dịch trên Solana thất bại (on-chain error): ${JSON.stringify(parsedTx.meta.err)}`,
      );
    }

    // 4. Extract and verify SystemProgram transfer instruction
    const relayerAddressStr = this.relayerPublicKey.toBase58();
    const transfer = this.findMatchingTransfer(
      parsedTx,
      dto.senderWallet,
      relayerAddressStr,
    );

    if (!transfer) {
      throw new BadRequestException(
        `Không tìm thấy lệnh SystemProgram.transfer hợp lệ chuyển từ ${dto.senderWallet} tới ví Relayer ${relayerAddressStr}.`,
      );
    }

    const transferredLamports = BigInt(transfer.lamports);
    const expectedLamports = BigInt(
      Math.round(dto.amountSol * LAMPORTS_PER_SOL),
    );

    // Tolerance of 100 Lamports for minor rounding differences
    if (
      transferredLamports < expectedLamports &&
      expectedLamports - transferredLamports > BigInt(100)
    ) {
      throw new BadRequestException(
        `Số lượng Lamports on-chain (${transferredLamports}) nhỏ hơn giá trị khai báo (${expectedLamports}).`,
      );
    }

    // 5. Atomic persistence into PostgreSQL RelayerFundingLog
    const recordedAt = new Date();
    await this.persistFundingLog({
      txHash: dto.txHash,
      senderWallet: dto.senderWallet,
      relayerWallet: relayerAddressStr,
      amountSol: dto.amountSol,
      amountLamports: transferredLamports,
      adminUserId: adminUser?.id ?? null,
      metadata: {
        network: this.networkName,
        slot: parsedTx.slot,
        blockTime: parsedTx.blockTime,
        twoFactorVerified: Boolean(dto.twoFactorCode),
        adminEmail: adminUser?.email,
      },
      createdAt: recordedAt,
    });

    this.logger.log(
      `[Funding Successful] ${dto.amountSol} SOL transferred from ${dto.senderWallet} to Relayer ${relayerAddressStr}. Tx: ${dto.txHash}`,
    );

    // 6. Query updated balance
    const updatedBalance = await this.getRelayerBalance();

    return {
      success: true,
      message: 'Xác thực và ghi nhận cấp vốn ví Solana Relayer thành công.',
      txHash: dto.txHash,
      amountSol: dto.amountSol,
      amountLamports: transferredLamports.toString(),
      senderWallet: dto.senderWallet,
      relayerAddress: relayerAddressStr,
      newBalanceSol: updatedBalance.balanceSol,
      recordedAt: recordedAt.toISOString(),
    };
  }

  /**
   * Validates 2FA code if 2FA verification is enforced in configuration.
   */
  private verifyTwoFactor(twoFactorCode?: string): void {
    const configuredPin = this.configService.get<string>('ADMIN_2FA_PIN');
    const enforce2fa =
      this.configService.get<string>('ENFORCE_2FA', 'true') === 'true';

    if (!enforce2fa && !twoFactorCode) {
      return;
    }

    if (!twoFactorCode || twoFactorCode.trim().length !== 6) {
      throw new UnauthorizedException(
        'Yêu cầu nhập mã xác thực 2 bước (2FA OTP/PIN 6 số) hợp lệ trước khi thực hiện cấp vốn.',
      );
    }

    if (configuredPin && twoFactorCode !== configuredPin) {
      throw new UnauthorizedException(
        'Mã xác thực 2 bước không chính xác hoặc đã hết hạn.',
      );
    }
  }

  /**
   * Asserts that txHash has not been processed already.
   */
  private async assertTransactionNotRecorded(txHash: string): Promise<void> {
    try {
      if ((this.prisma as any).relayerFundingLog?.findUnique) {
        const existing = await (
          this.prisma as any
        ).relayerFundingLog.findUnique({
          where: { txHash },
        });
        if (existing) {
          throw new ConflictException(
            'Chữ ký giao dịch (TxHash) đã được ghi nhận trước đó. Ngăn chặn tấn công lặp lại (Replay Attack).',
          );
        }
        return;
      }
    } catch (err) {
      if (err instanceof ConflictException) throw err;
    }

    const existingRows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM relayer_funding_logs WHERE tx_hash = ${txHash} LIMIT 1
    `.catch(() => []);

    if (existingRows.length > 0) {
      throw new ConflictException(
        'Chữ ký giao dịch (TxHash) đã được ghi nhận trước đó. Ngăn chặn tấn công lặp lại (Replay Attack).',
      );
    }
  }

  /**
   * Fetches parsed transaction from Solana RPC with automatic single retry for replication lag.
   */
  private async fetchParsedTransaction(txHash: string) {
    let parsedTx = await this.connection.getParsedTransaction(txHash, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!parsedTx) {
      // 1.5s backoff retry for newly broadcast transactions
      await new Promise((resolve) => setTimeout(resolve, 1500));
      parsedTx = await this.connection.getParsedTransaction(txHash, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });
    }

    if (!parsedTx) {
      throw new BadRequestException(
        'Không tìm thấy giao dịch trên mạng Solana RPC (hoặc chưa đạt trạng thái confirmed).',
      );
    }

    return parsedTx;
  }

  /**
   * Inspects parsed instructions and inner instructions for matching SystemProgram transfer.
   */
  private findMatchingTransfer(
    parsedTx: any,
    senderWallet: string,
    relayerAddress: string,
  ): SystemTransferInfo | null {
    const instructions: Array<
      ParsedInstruction | PartiallyDecodedInstruction
    > = parsedTx.transaction?.message?.instructions ?? [];

    for (const ix of instructions) {
      const match = this.extractTransferInfo(ix, senderWallet, relayerAddress);
      if (match) return match;
    }

    const innerSets = parsedTx.meta?.innerInstructions ?? [];
    for (const set of innerSets) {
      for (const ix of set.instructions ?? []) {
        const match = this.extractTransferInfo(
          ix,
          senderWallet,
          relayerAddress,
        );
        if (match) return match;
      }
    }

    return null;
  }

  private extractTransferInfo(
    ix: any,
    senderWallet: string,
    relayerAddress: string,
  ): SystemTransferInfo | null {
    if (
      ix.program === 'system' &&
      ix.parsed &&
      (ix.parsed.type === 'transfer' || ix.parsed.type === 'transferChecked')
    ) {
      const info = ix.parsed.info;
      if (
        info &&
        info.destination === relayerAddress &&
        info.source === senderWallet &&
        info.lamports
      ) {
        return {
          source: info.source,
          destination: info.destination,
          lamports: info.lamports,
        };
      }
    }
    return null;
  }

  /**
   * Persists funding log record with dual Prisma ORM / raw SQL fallback.
   */
  private async persistFundingLog(data: {
    txHash: string;
    senderWallet: string;
    relayerWallet: string;
    amountSol: number;
    amountLamports: bigint;
    adminUserId: string | null;
    metadata: Record<string, unknown>;
    createdAt: Date;
  }): Promise<void> {
    try {
      if ((this.prisma as any).relayerFundingLog?.create) {
        await (this.prisma as any).relayerFundingLog.create({
          data: {
            txHash: data.txHash,
            senderWallet: data.senderWallet,
            relayerWallet: data.relayerWallet,
            amountSol: data.amountSol,
            amountLamports: data.amountLamports,
            adminUserId: data.adminUserId,
            status: 'CONFIRMED',
            metadata: data.metadata,
            createdAt: data.createdAt,
          },
        });
        return;
      }
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException(
          'Giao dịch này đã được ghi nhận trong cơ sở dữ liệu.',
        );
      }
    }

    await this.prisma.$executeRaw`
      INSERT INTO relayer_funding_logs (
        id, tx_hash, sender_wallet, relayer_wallet, amount_sol, amount_lamports, admin_user_id, status, metadata, created_at
      ) VALUES (
        uuid_generate_v4(), ${data.txHash}, ${data.senderWallet}, ${data.relayerWallet}, ${data.amountSol}, ${data.amountLamports}, ${data.adminUserId}, 'CONFIRMED', ${JSON.stringify(data.metadata)}::jsonb, ${data.createdAt}
      )
      ON CONFLICT (tx_hash) DO NOTHING
    `;
  }
}

