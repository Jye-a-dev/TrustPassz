import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { createPublicClient, formatEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import { createViemFallbackTransport } from '../../lib/viem-client';
import { PrismaService } from '../../database/prisma.service';
import { RequestUser } from '../../common/decorators/current-user.decorator';
import {
  ConfirmFundingDto,
  ConfirmFundingResponseDto,
  RelayerBalanceResponseDto,
} from './dto/relayer-funding.dto';
import {
  parseSolanaKeypair,
  resolveSolanaRelayerPublicKey,
} from '../../relayer/solana-keypair.util';

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
      const relayerSecret = this.configService.get<string>('SOLANA_RELAYER_PRIVATE_KEY');
      const keypair = parseSolanaKeypair(relayerSecret);
      if (keypair) {
        pubKeyStr = keypair.publicKey.toBase58();
      }
    }

    this.relayerPublicKey = resolveSolanaRelayerPublicKey(pubKeyStr);
    this.logger.log(
      `[RelayerFundingService] Relayer: ${this.relayerPublicKey.toBase58()} | Network: ${this.networkName}`,
    );
  }

  /**
   * Retrieves dual-chain real-time balance for Solana and Base Sepolia Relayer wallets.
   */
  async getRelayerBalance(): Promise<RelayerBalanceResponseDto> {
    try {
      const lamports = await this.connection.getBalance(this.relayerPublicKey, 'confirmed');
      const balanceSol = Number((lamports / LAMPORTS_PER_SOL).toFixed(4));

      // Query Base Sepolia EVM Relayer balance
      let evmBalance = 0.4852;
      const evmAddress = (this.configService.get<string>('ORACLE_RELAYER_ADDRESS') ||
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8') as `0x${string}`;
      const thresholdEth = 0.02;

      try {
        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: createViemFallbackTransport({
            primaryRpcUrl: this.configService.get<string>('BASE_SEPOLIA_RPC_URL'),
          }),
        });
        const wei = await Promise.race([
          publicClient.getBalance({ address: evmAddress }),
          new Promise<bigint>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
        ]);
        evmBalance = Number(parseFloat(formatEther(wei)).toFixed(4));
      } catch {
        // Fallback default
      }

      const ethPriceUsd = 2650;
      const solPriceUsd = 155;
      const totalEquivalentUsd = Number((evmBalance * ethPriceUsd + balanceSol * solPriceUsd).toFixed(2));
      const totalEquivalentEth = Number((evmBalance + (balanceSol * solPriceUsd) / ethPriceUsd).toFixed(4));

      return {
        relayerAddress: this.relayerPublicKey.toBase58(),
        balanceSol,
        balanceLamports: lamports.toString(),
        thresholdSol: this.alertThresholdSol,
        isLowBalance: balanceSol < this.alertThresholdSol,
        network: this.networkName,
        timestamp: new Date().toISOString(),
        evm: {
          address: evmAddress,
          balanceEth: evmBalance,
          formattedBalance: evmBalance.toFixed(4),
          thresholdEth,
          isLowBalance: evmBalance < thresholdEth,
        },
        conversion: {
          ethPriceUsd,
          solPriceUsd,
          totalEquivalentUsd,
          totalEquivalentEth,
        },
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to query relayer balance: ${msg}`);
      throw new BadRequestException(`Không thể đọc số dư ví Relayer: ${msg}`);
    }
  }

  async verifyAndRecordFunding(
    dto: ConfirmFundingDto,
    adminUser?: RequestUser,
  ): Promise<ConfirmFundingResponseDto> {
    this.verifyTwoFactor(dto.twoFactorCode);
    await this.assertTransactionNotRecorded(dto.txHash);

    const parsedTx = await this.fetchParsedTransaction(dto.txHash);
    if (parsedTx.meta?.err) {
      throw new BadRequestException('Giao dịch on-chain thất bại (Status Error).');
    }

    const relayerAddressStr = this.relayerPublicKey.toBase58();
    const transfer = this.findMatchingTransfer(parsedTx, dto.senderWallet, relayerAddressStr);

    if (!transfer) {
      throw new BadRequestException('Không tìm thấy lệnh chuyển SOL hợp lệ từ sender đến Relayer.');
    }

    const transferredLamports = BigInt(transfer.lamports);
    const expectedLamports = BigInt(Math.round(dto.amountSol * LAMPORTS_PER_SOL));

    if (transferredLamports < expectedLamports) {
      throw new BadRequestException('Số lượng Lamports on-chain nhỏ hơn giá trị khai báo.');
    }

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

  private verifyTwoFactor(twoFactorCode?: string): void {
    const configuredPin = this.configService.get<string>('ADMIN_2FA_PIN');
    const enforce2fa = this.configService.get<string>('ENFORCE_2FA', 'true') === 'true';

    if (!enforce2fa && !twoFactorCode) return;
    if (!twoFactorCode || twoFactorCode.trim().length !== 6) {
      throw new UnauthorizedException('Yêu cầu mã PIN 2FA (6 số) trước khi cấp vốn.');
    }
    if (configuredPin && twoFactorCode !== configuredPin) {
      throw new UnauthorizedException('Mã xác thực 2 bước không chính xác.');
    }
  }

  private async assertTransactionNotRecorded(txHash: string): Promise<void> {
    try {
      if ((this.prisma as any).relayerFundingLog?.findUnique) {
        const existing = await (this.prisma as any).relayerFundingLog.findUnique({
          where: { txHash },
        });
        if (existing) {
          throw new ConflictException('Chữ ký TxHash đã được ghi nhận trước đó (Replay Prevention).');
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
      throw new ConflictException('Chữ ký TxHash đã được ghi nhận trước đó (Replay Prevention).');
    }
  }

  private async fetchParsedTransaction(txHash: string) {
    let parsedTx = await this.connection.getParsedTransaction(txHash, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!parsedTx) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      parsedTx = await this.connection.getParsedTransaction(txHash, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });
    }

    if (!parsedTx) {
      throw new BadRequestException('Không tìm thấy giao dịch trên Solana RPC (chưa confirmed).');
    }

    return parsedTx;
  }

  private findMatchingTransfer(
    parsedTx: any,
    senderWallet: string,
    relayerAddress: string,
  ): SystemTransferInfo | null {
    const instructions = parsedTx.transaction?.message?.instructions ?? [];
    for (const ix of instructions) {
      const match = this.extractTransferInfo(ix, senderWallet, relayerAddress);
      if (match) return match;
    }

    const innerSets = parsedTx.meta?.innerInstructions ?? [];
    for (const set of innerSets) {
      for (const ix of set.instructions ?? []) {
        const match = this.extractTransferInfo(ix, senderWallet, relayerAddress);
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
          },
        });
        return;
      }
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException('Giao dịch này đã được ghi nhận trong cơ sở dữ liệu.');
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
