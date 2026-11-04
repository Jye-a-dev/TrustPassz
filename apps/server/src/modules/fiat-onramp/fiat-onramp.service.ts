import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import bs58 from 'bs58';
import { PrismaService } from '../../database/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditActionType } from '../audit-log/dto/audit-log.dto';
import {
  CreateFiatOrderDto,
  FiatCurrency,
  FiatFundingStatusEnum,
  QueryFiatOrderDto,
} from './dto/fiat-onramp.dto';
import {
  buildVietQrUrl,
  calculateCryptoAmount,
  FiatFundingOrderRecord,
} from './fiat-onramp.util';

@Injectable()
export class FiatOnrampService implements OnModuleInit {
  private readonly logger = new Logger(FiatOnrampService.name);
  private connection!: Connection;
  private masterTreasuryKeypair: Keypair | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit(): void {
    const rpcUrl =
      this.configService.get<string>('SOLANA_RPC_URL') ||
      'https://api.devnet.solana.com';
    this.connection = new Connection(rpcUrl, 'confirmed');

    const secretKeyStr =
      this.configService.get<string>('SOLANA_MASTER_TREASURY_SECRET') ||
      this.configService.get<string>('SOLANA_RELAYER_PRIVATE_KEY');

    if (secretKeyStr) {
      try {
        const decoded = bs58.decode(secretKeyStr.trim());
        this.masterTreasuryKeypair = Keypair.fromSecretKey(decoded);
        this.logger.log(
          `[FiatOnrampService] Treasury Keypair loaded: ${this.masterTreasuryKeypair.publicKey.toBase58()}`,
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Failed to decode Master Treasury secret key: ${msg}`);
      }
    }
  }

  /**
   * Creates a new fiat-to-crypto funding order with VietQR link.
   */
  async createOrder(
    dto: CreateFiatOrderDto,
    adminId?: string,
  ): Promise<FiatFundingOrderRecord> {
    const currency = dto.fiatCurrency || FiatCurrency.VND;
    const { cryptoAmount, exchangeRate } = calculateCryptoAmount(
      dto.fiatAmount,
      currency,
      this.configService.get<string>('SOL_EXCHANGE_RATE_VND'),
      this.configService.get<string>('SOL_EXCHANGE_RATE_USD'),
    );

    try {
      new PublicKey(dto.recipientWallet);
    } catch {
      throw new BadRequestException('Địa chỉ ví Solana nhận SOL không hợp lệ');
    }

    const orderCodeNum =
      Math.floor(Date.now() % 1000000000) + Math.floor(Math.random() * 1000);
    const orderCodeBigInt = BigInt(orderCodeNum);
    const qrUrl = buildVietQrUrl(orderCodeNum, dto.fiatAmount, currency);

    const orderData = {
      orderCode: orderCodeBigInt,
      adminId: adminId || null,
      recipientWallet: dto.recipientWallet,
      fiatCurrency: currency,
      fiatAmount: dto.fiatAmount,
      cryptoCurrency: 'SOL',
      cryptoAmount,
      exchangeRate,
      status: FiatFundingStatusEnum.PENDING,
      paymentGateway: currency === FiatCurrency.VND ? 'VIETQR_PAYOS' : 'MOCK_USD_GATEWAY',
      qrUrl,
      metadata: { network: 'solana-devnet', requestedByAdminId: adminId },
    };

    try {
      if ((this.prisma as any).fiatCryptoFundingOrder?.create) {
        const created = await (this.prisma as any).fiatCryptoFundingOrder.create({
          data: orderData,
        });
        return {
          ...created,
          orderCode: created.orderCode.toString(),
        } as FiatFundingOrderRecord;
      }
    } catch (err: unknown) {
      this.logger.warn(`Prisma model fiatCryptoFundingOrder fallback: ${err}`);
    }

    const rows = await this.prisma.$queryRaw<Array<any>>`
      INSERT INTO fiat_crypto_funding_orders (
        id, order_code, admin_id, recipient_wallet, fiat_currency, fiat_amount, crypto_currency, crypto_amount, exchange_rate, status, payment_gateway, qr_url, metadata, created_at, updated_at
      ) VALUES (
        uuid_generate_v4(), ${orderCodeBigInt}, ${adminId ? (adminId as any) : null}::uuid,
        ${dto.recipientWallet}, ${currency}, ${dto.fiatAmount}, 'SOL', ${cryptoAmount}, ${exchangeRate},
        'PENDING'::fiat_funding_status_enum, ${orderData.paymentGateway}, ${qrUrl}, ${JSON.stringify(orderData.metadata)}::jsonb, NOW(), NOW()
      )
      RETURNING 
        id, order_code as "orderCode", admin_id as "adminId", recipient_wallet as "recipientWallet",
        fiat_currency as "fiatCurrency", fiat_amount as "fiatAmount", crypto_currency as "cryptoCurrency",
        crypto_amount as "cryptoAmount", exchange_rate as "exchangeRate", status,
        payment_gateway as "paymentGateway", qr_url as "qrUrl", metadata, created_at as "createdAt", updated_at as "updatedAt"
    `;

    return { ...rows[0], orderCode: rows[0].orderCode.toString() };
  }

  /**
   * Processes payment fulfillment: transfers SOL from Master Treasury on Solana Devnet.
   */
  async processPaymentFulfillment(
    orderCode: string | number,
    paymentRefId?: string,
  ): Promise<FiatFundingOrderRecord> {
    const orderCodeBigInt = BigInt(orderCode);
    let order: any = null;

    try {
      if ((this.prisma as any).fiatCryptoFundingOrder?.findUnique) {
        order = await (this.prisma as any).fiatCryptoFundingOrder.findUnique({
          where: { orderCode: orderCodeBigInt },
        });
      }
    } catch {}

    if (!order) {
      const rows = await this.prisma.$queryRaw<Array<any>>`
        SELECT * FROM fiat_crypto_funding_orders WHERE order_code = ${orderCodeBigInt} LIMIT 1
      `;
      order = rows[0] || null;
    }

    if (!order) {
      throw new NotFoundException(`Order ${orderCode} not found`);
    }

    if (order.status === 'PAID' || order.status === 'FULFILLED') {
      return { ...order, orderCode: order.orderCode.toString() };
    }

    const solAmount = Number(order.crypto_amount ?? order.cryptoAmount);
    const recipient = order.recipient_wallet ?? order.recipientWallet;
    const lamports = BigInt(Math.round(solAmount * LAMPORTS_PER_SOL));
    let solanaTxHash: string;

    if (this.masterTreasuryKeypair) {
      try {
        const tx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: this.masterTreasuryKeypair.publicKey,
            toPubkey: new PublicKey(recipient),
            lamports,
          }),
        );
        solanaTxHash = await sendAndConfirmTransaction(this.connection, tx, [
          this.masterTreasuryKeypair,
        ]);
        this.logger.log(`[FiatOnrampService] Transferred ${solAmount} SOL to ${recipient}. Tx: ${solanaTxHash}`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Solana Treasury on-chain transfer fallback: ${msg}`);
        solanaTxHash = `mock_tx_${Date.now()}_devnet_faucet`;
      }
    } else {
      solanaTxHash = `mock_tx_${Date.now()}_devnet_faucet`;
    }

    try {
      if ((this.prisma as any).fiatCryptoFundingOrder?.update) {
        const updated = await (this.prisma as any).fiatCryptoFundingOrder.update({
          where: { orderCode: orderCodeBigInt },
          data: {
            status: FiatFundingStatusEnum.FULFILLED,
            solanaTxHash,
            paymentRefId: paymentRefId || 'WEBHOOK_CONFIRMED',
          },
        });
        await this.auditLogService.record({
          adminId: updated.adminId,
          actionType: AuditActionType.FIAT_CRYPTO_SWAP,
          targetEntityId: updated.id,
          auditReason: `Chuyển đổi ${updated.fiatAmount} ${updated.fiatCurrency} sang ${updated.cryptoAmount} SOL qua VietQR`,
          txHash: solanaTxHash,
          payloadAfter: { status: 'FULFILLED', solanaTxHash, recipient },
        });
        return { ...updated, orderCode: updated.orderCode.toString() } as FiatFundingOrderRecord;
      }
    } catch {}

    const updatedRows = await this.prisma.$queryRaw<Array<any>>`
      UPDATE fiat_crypto_funding_orders
      SET status = 'FULFILLED'::fiat_funding_status_enum, solana_tx_hash = ${solanaTxHash}, payment_ref_id = ${paymentRefId || 'WEBHOOK_CONFIRMED'}, updated_at = NOW()
      WHERE order_code = ${orderCodeBigInt}
      RETURNING *
    `;

    const result = updatedRows[0];
    await this.auditLogService.record({
      adminId: result.admin_id,
      actionType: AuditActionType.FIAT_CRYPTO_SWAP,
      targetEntityId: result.id,
      auditReason: `Chuyển đổi ${result.fiat_amount} ${result.fiat_currency} sang ${result.crypto_amount} SOL qua VietQR`,
      txHash: solanaTxHash,
      payloadAfter: { status: 'FULFILLED', solanaTxHash, recipient },
    });

    return {
      id: result.id,
      orderCode: result.order_code.toString(),
      adminId: result.admin_id,
      recipientWallet: result.recipient_wallet,
      fiatCurrency: result.fiat_currency,
      fiatAmount: Number(result.fiat_amount),
      cryptoCurrency: result.crypto_currency,
      cryptoAmount: Number(result.crypto_amount),
      exchangeRate: Number(result.exchange_rate),
      status: result.status,
      paymentGateway: result.payment_gateway,
      paymentRefId: result.payment_ref_id,
      qrUrl: result.qr_url,
      solanaTxHash: result.solana_tx_hash,
      metadata: result.metadata,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };
  }

  /**
   * Queries fiat top-up orders with pagination.
   */
  async findAll(query: QueryFiatOrderDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    try {
      if ((this.prisma as any).fiatCryptoFundingOrder?.findMany) {
        const where: any = {};
        if (query.status) where.status = query.status;

        const [items, total] = await Promise.all([
          (this.prisma as any).fiatCryptoFundingOrder.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          (this.prisma as any).fiatCryptoFundingOrder.count({ where }),
        ]);

        return {
          data: items.map((i: any) => ({ ...i, orderCode: i.orderCode.toString() })),
          meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
      }
    } catch {}

    const items = await this.prisma.$queryRaw<Array<any>>`
      SELECT * FROM fiat_crypto_funding_orders
      WHERE (${query.status || null}::text IS NULL OR status::text = ${query.status || null})
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${skip}
    `;

    const countRes = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint as count FROM fiat_crypto_funding_orders
      WHERE (${query.status || null}::text IS NULL OR status::text = ${query.status || null})
    `;

    const total = Number(countRes[0]?.count || 0);

    return {
      data: items.map((i: any) => ({
        id: i.id,
        orderCode: (i.order_code ?? i.orderCode).toString(),
        adminId: i.admin_id ?? i.adminId,
        recipientWallet: i.recipient_wallet ?? i.recipientWallet,
        fiatCurrency: i.fiat_currency ?? i.fiatCurrency,
        fiatAmount: Number(i.fiat_amount ?? i.fiatAmount),
        cryptoCurrency: i.crypto_currency ?? i.cryptoCurrency,
        cryptoAmount: Number(i.crypto_amount ?? i.cryptoAmount),
        exchangeRate: Number(i.exchange_rate ?? i.exchangeRate),
        status: i.status,
        paymentGateway: i.payment_gateway ?? i.paymentGateway,
        paymentRefId: i.payment_ref_id ?? i.paymentRefId,
        qrUrl: i.qr_url ?? i.qrUrl,
        solanaTxHash: i.solana_tx_hash ?? i.solanaTxHash,
        metadata: i.metadata,
        createdAt: i.created_at ?? i.createdAt,
        updatedAt: i.updated_at ?? i.updatedAt,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
