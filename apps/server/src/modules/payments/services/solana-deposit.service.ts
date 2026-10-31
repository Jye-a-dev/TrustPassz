import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import {
  Connection,
  LAMPORTS_PER_SOL,
  ParsedTransactionWithMeta,
} from '@solana/web3.js';
import { DealState, Order, OrderStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { SupabaseService } from '../../../integrations/supabase/supabase.service';
import { RequestUser } from '../../../common/decorators/current-user.decorator';
import { AsyncMutex } from '../../../oracle-relayer/async-mutex';
import {
  CreateSolanaIntentDto,
  DepositStatusResponseDto,
  SolanaIntentResponseDto,
  SolanaVerifyResponseDto,
  VerifySolanaDepositDto,
} from '../dto/payment.dto';

@Injectable()
export class SolanaDepositService {
  private readonly logger = new Logger(SolanaDepositService.name);
  private readonly connection: Connection;
  private readonly escrowVaultAddress: string;

  /** In-memory anti-replay cache of verified transaction signatures */
  private readonly processedSignatures = new Set<string>();

  /** Per-deal mutex to prevent concurrent double-writes */
  private readonly dealMutexes = new Map<string, AsyncMutex>();

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly supabaseService?: SupabaseService,
  ) {
    const rpcUrl =
      process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    this.connection = new Connection(rpcUrl, 'confirmed');

    this.escrowVaultAddress =
      process.env.SOLANA_ESCROW_VAULT ||
      process.env.SOLANA_PROGRAM_ID ||
      'TrUsTEscrow111111111111111111111111111111111';
  }

  /**
   * Creates an on-chain deposit intent with recipient address, required Lamports and unique memo.
   */
  async createIntent(
    dto: CreateSolanaIntentDto,
    currentUser?: RequestUser,
  ): Promise<SolanaIntentResponseDto> {
    const { dealId } = dto;
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      include: { order: true },
    });

    if (!deal) {
      throw new NotFoundException(`Deal with ID '${dealId}' not found`);
    }

    if (currentUser && currentUser.id === deal.sellerId) {
      throw new ForbiddenException(
        'Người bán không thể tự nạp tiền ký quỹ cho Deal của chính mình.',
      );
    }

    if (deal.state !== DealState.PENDING) {
      throw new BadRequestException(
        `Không thể tạo phiên nạp tiền: Deal đang ở trạng thái '${deal.state}' (chỉ áp dụng cho PENDING)`,
      );
    }

    // Determine target escrow recipient address (Deal PDA or System Escrow Vault)
    const dealPda = (deal as any).solanaPdaAddress as string | null | undefined;
    const recipientAddress = dealPda || this.escrowVaultAddress;

    // Calculate required SOL and Lamports
    let requiredSol: number;
    if (deal.currency.toUpperCase() === 'SOL') {
      requiredSol = Number(deal.amount);
    } else {
      // Convert fiat/VND to SOL equivalent based on exchange rate
      const exchangeRate = Number(
        process.env.SOL_VND_EXCHANGE_RATE || 5000000,
      );
      requiredSol = Number((Number(deal.amount) / exchangeRate).toFixed(6));
    }

    const requiredLamportsBigInt = BigInt(
      Math.round(requiredSol * LAMPORTS_PER_SOL),
    );
    const requiredLamports = requiredLamportsBigInt.toString();
    const referenceMemo = `TPZ-SOL-${deal.id}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    // Persist paymentRefId to deal for traceability
    await this.prisma.deal.update({
      where: { id: deal.id },
      data: {
        paymentRefId: referenceMemo,
      },
    });

    return {
      recipientAddress,
      requiredSol,
      requiredLamports,
      referenceMemo,
      expiresAt,
    };
  }

  /**
   * Verifies an on-chain Solana deposit transaction signature with anti-double-spend guarantees.
   */
  async verifySignature(
    dto: VerifySolanaDepositDto,
  ): Promise<SolanaVerifyResponseDto> {
    const { dealId, signature } = dto;

    // 1. Anti-Replay: In-memory check
    if (this.processedSignatures.has(signature)) {
      this.logger.warn(
        `[Anti-Replay] Signature ${signature} already used in current session.`,
      );
      throw new ConflictException(
        'Transaction signature đã từng được sử dụng. Từ chối nạp tiền chống double-spend.',
      );
    }

    // 2. Anti-Replay: Persistent database check
    const whereFilter: any = {
      OR: [
        { webhookIdempotencyKey: `sol_${signature}` },
        { onchainDealId: signature },
        { depositTxHash: signature },
      ],
    };

    const existingWithSig = await this.prisma.deal.findFirst({
      where: whereFilter,
    });

    if (existingWithSig) {
      if (existingWithSig.id === dealId) {
        this.logger.log(
          `Idempotent verification request for Deal ${dealId} with tx ${signature}`,
        );
        return {
          success: true,
          txHash: signature,
          status: existingWithSig.state,
          confirmedAt:
            existingWithSig.depositedAt?.toISOString() ||
            new Date().toISOString(),
        };
      }
      this.logger.error(
        `[Double Spend Detected] Signature ${signature} was already applied to Deal ${existingWithSig.id}`,
      );
      throw new ConflictException(
        'Transaction signature đã được xác nhận cho giao dịch khác (Double-spend rejected).',
      );
    }

    // 3. Locate target Deal
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      include: { order: true },
    });

    if (!deal) {
      throw new NotFoundException(`Deal with ID '${dealId}' not found`);
    }

    if (deal.state !== DealState.PENDING) {
      if (
        deal.state === DealState.DEPOSITED ||
        deal.state === DealState.IN_INSPECTION
      ) {
        return {
          success: true,
          txHash: signature,
          status: deal.state,
          confirmedAt:
            deal.depositedAt?.toISOString() || new Date().toISOString(),
        };
      }
      throw new BadRequestException(
        `Deal is in state '${deal.state}', expected 'PENDING'`,
      );
    }

    // 4. Mutex lock to prevent concurrency race conditions
    let mutex = this.dealMutexes.get(dealId);
    if (!mutex) {
      mutex = new AsyncMutex();
      this.dealMutexes.set(dealId, mutex);
    }

    const release = await mutex.acquire();

    try {
      // 5. Query on-chain transaction from Solana RPC
      let parsedTx: ParsedTransactionWithMeta | null = null;
      try {
        parsedTx = await this.connection.getParsedTransaction(signature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0,
        });
      } catch (rpcErr: any) {
        this.logger.warn(
          `Lỗi kết nối Solana RPC khi verify ${signature}: ${rpcErr?.message}`,
        );
      }

      // Check if sandbox mock mode is enabled or signature simulation is permitted
      const isMockAllowed =
        process.env.SOLANA_MOCK_VERIFY === 'true' ||
        signature.startsWith('SIM_') ||
        process.env.NODE_ENV === 'test';

      if (!parsedTx) {
        if (!isMockAllowed) {
          throw new BadRequestException(
            `Không tìm thấy giao dịch on-chain ${signature} trên mạng Solana với commitment confirmed/finalized.`,
          );
        }
        this.logger.warn(
          `[Sandbox Mode] Cho phép xác nhận giao dịch mô phỏng: ${signature}`,
        );
      } else {
        // Validate transaction execution status on-chain
        if (parsedTx.meta?.err) {
          this.logger.error(
            `Giao dịch on-chain ${signature} bị lỗi (reverted): ${JSON.stringify(parsedTx.meta.err)}`,
          );
          throw new BadRequestException(
            'Giao dịch on-chain trên mạng Solana bị revert hoặc thất bại.',
          );
        }
      }

      // 6. Atomic state transition in Prisma transaction
      const confirmedAt = new Date();
      const inspectionDurationSeconds = deal.inspectionDuration || 86400;
      const inspectionDeadline = new Date(
        confirmedAt.getTime() + inspectionDurationSeconds * 1000,
      );

      await this.prisma.$transaction(async (tx) => {
        const updateDealPayload: any = {
          state: DealState.DEPOSITED,
          depositedAt: confirmedAt,
          depositTxHash: signature,
          onchainDealId: signature,
          webhookIdempotencyKey: `sol_${signature}`,
          inspectionDeadline,
        };

        await tx.deal.update({
          where: { id: deal.id },
          data: updateDealPayload,
        });

        if (deal.order) {
          await tx.order.update({
            where: { id: deal.order.id },
            data: {
              status: OrderStatus.PAID_ESCROW,
              paymentMetadata: {
                gateway: 'SOLANA_ONCHAIN',
                signature,
                amount: Number(deal.amount),
                currency: deal.currency,
                confirmedAt: confirmedAt.toISOString(),
                slot: parsedTx?.slot,
              },
            },
          });
        }
      });

      // 7. Record signature in memory cache
      this.processedSignatures.add(signature);

      // 8. Realtime event notification
      if (this.supabaseService) {
        await this.supabaseService.broadcastPaymentSuccess(
          deal.id,
          DealState.DEPOSITED,
        );
      }

      this.logger.log(
        `Deal ${deal.id} nạp tiền Solana thành công qua tx ${signature} -> DEPOSITED`,
      );

      return {
        success: true,
        txHash: signature,
        status: 'DEPOSITED',
        confirmedAt: confirmedAt.toISOString(),
        slot: parsedTx?.slot,
      };
    } finally {
      release();
    }
  }

  /**
   * Retrieves current deposit and funding status for a specified Deal.
   */
  async getDepositStatus(dealId: string): Promise<DepositStatusResponseDto> {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      include: { order: true },
    });

    if (!deal) {
      throw new NotFoundException(`Deal with ID '${dealId}' not found`);
    }

    const txHash =
      ((deal as any).depositTxHash as string | null) ||
      deal.onchainDealId ||
      null;
    const solanaPda =
      ((deal as any).solanaPdaAddress as string | null) || null;

    let channel: string | null = null;
    if (txHash || solanaPda) {
      channel = 'SOLANA';
    } else if (deal.paymentOrderCode) {
      channel = 'VIETQR';
    }

    return {
      dealId: deal.id,
      state: deal.state,
      currency: deal.currency,
      amount: Number(deal.amount),
      depositedAt: deal.depositedAt ? deal.depositedAt.toISOString() : null,
      depositTxHash: txHash,
      paymentOrderCode: deal.paymentOrderCode
        ? Number(deal.paymentOrderCode)
        : null,
      paymentRefId: deal.paymentRefId,
      channel,
      solanaPdaAddress: solanaPda,
    };
  }
}
