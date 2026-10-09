import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { CreatePaymentLinkResponse, PayOS, Webhook } from '@payos/node';
import { DealState, Order, OrderStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { SupabaseService } from '../../integrations/supabase/supabase.service';
import { CreatePaymentLinkDto, PayOSWebhookDto } from './dto/payment.dto';
import { RequestUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly payOS: PayOS;
  private readonly checksumKey: string;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly supabaseService?: SupabaseService,
  ) {
    const clientId = process.env.PAYOS_CLIENT_ID || 'mock-payos-client-id';
    const apiKey = process.env.PAYOS_API_KEY || 'mock-payos-api-key';
    this.checksumKey =
      process.env.PAYOS_CHECKSUM_KEY || 'mock_checksum_key_1234567890';

    this.payOS = new PayOS({
      clientId,
      apiKey,
      checksumKey: this.checksumKey,
    });
  }

  /**
   * Generates a dynamic VietQR payment link via PayOS SDK and associates orderCode with Deal.
   */
  async createPaymentLink(
    dealId: string,
    dto?: CreatePaymentLinkDto,
    currentUser?: RequestUser,
  ) {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      include: { order: true, buyer: true, seller: true },
    });

    if (!deal) {
      throw new NotFoundException(`Deal with ID '${dealId}' not found`);
    }

    if (currentUser && currentUser.id === deal.sellerId) {
      throw new ForbiddenException(
        'Bạn không thể tự mua sản phẩm của chính mình.',
      );
    }

    if (deal.state !== DealState.PENDING) {
      throw new BadRequestException(
        `Cannot initiate payment: Deal ${dealId} is in state '${deal.state}' (only PENDING deals can accept deposits)`,
      );
    }

    // Generate safe positive integer orderCode (max: 9007199254740991 for PayOS / JavaScript Safe Integer)
    const timestampPart = Date.now() % 1000000000;
    const randomPart = Math.floor(100 + Math.random() * 900);
    const orderCode = Number(`${timestampPart}${randomPart}`);

    const returnUrl =
      dto?.returnUrl ||
      process.env.PAYOS_RETURN_URL ||
      'https://trustpassz.io/checkout/success';
    const cancelUrl =
      dto?.cancelUrl ||
      process.env.PAYOS_CANCEL_URL ||
      'https://trustpassz.io/checkout/cancel';

    // PayOS requires description length <= 25 characters
    const rawDesc = dto?.description || `Deal ${deal.id.slice(0, 8)}`;
    const description = rawDesc.slice(0, 25);
    const amountNumber = Math.round(Number((deal as any).price ?? deal.amount));

    let gatewayResponse: Partial<CreatePaymentLinkResponse> | null = null;

    // Call upstream PayOS SDK if valid production/sandbox credentials exist
    try {
      const isConfigured =
        process.env.PAYOS_CLIENT_ID &&
        process.env.PAYOS_API_KEY &&
        process.env.PAYOS_CHECKSUM_KEY &&
        !process.env.PAYOS_CLIENT_ID.startsWith('mock-');

      if (isConfigured) {
        gatewayResponse = await this.payOS.paymentRequests.create({
          orderCode,
          amount: amountNumber,
          description,
          cancelUrl,
          returnUrl,
        });
      }
    } catch (error: any) {
      this.logger.warn(
        `PayOS SDK call failed: ${error?.message || error}. Defaulting to sandbox VietQR generator.`,
      );
    }

    // Save paymentOrderCode into Deal model
    await this.prisma.deal.update({
      where: { id: deal.id },
      data: {
        paymentOrderCode: BigInt(orderCode),
      },
    });

    const bin = gatewayResponse?.bin || process.env.ESCROW_BANK_BIN || '970422';
    const accountNumber =
      gatewayResponse?.accountNumber ||
      process.env.ESCROW_BANK_ACCOUNT_NO ||
      process.env.PAYOS_ACCOUNT_NUMBER ||
      '998877';
    const accountName = gatewayResponse?.accountName || 'TRUSTPASSZ ESCROW';
    const checkoutUrl =
      gatewayResponse?.checkoutUrl || `https://pay.payos.vn/web/${orderCode}`;
    const qrCode =
      gatewayResponse?.qrCode ||
      `vietqr://pay?acc=${accountNumber}&bin=${bin}&amount=${amountNumber}&memo=${orderCode}`;

    return {
      dealId: deal.id,
      orderCode,
      amount: amountNumber,
      currency: deal.currency,
      description,
      bin,
      accountNumber,
      accountNo: accountNumber,
      accountName,
      checkoutUrl,
      qrCode,
      paymentLinkId: gatewayResponse?.paymentLinkId || `pl_${orderCode}`,
      status: gatewayResponse?.status || 'PENDING',
    };
  }

  /**
   * Processes incoming PayOS webhook with HMAC-SHA256 signature verification,
   * Idempotency Replay Attack prevention, and atomic Deal state transition.
   */
  async handleWebhook(payload: PayOSWebhookDto) {
    if (!payload || !payload.data || !payload.signature) {
      throw new BadRequestException(
        'Invalid webhook payload: Missing data or cryptographic signature',
      );
    }

    // 1. Cryptographic HMAC-SHA256 Signature Verification
    const isSignatureValid = await this.verifySignature(payload);
    if (!isSignatureValid) {
      this.logger.error(
        `Webhook HMAC-SHA256 signature verification rejected for orderCode ${payload.data.orderCode}`,
      );
      throw new BadRequestException(
        'HMAC-SHA256 signature verification failed. Untrusted webhook origin.',
      );
    }

    const { data } = payload;
    const orderCode = data.orderCode;
    const idempotencyKey =
      data.reference || `payos_${orderCode}_${data.amount}`;

    // 2. Replay Attack Prevention (Idempotency Control)
    const existingProcessedDeal = await this.prisma.deal.findFirst({
      where: { webhookIdempotencyKey: idempotencyKey },
    });

    if (existingProcessedDeal) {
      this.logger.log(
        `Idempotent duplicate webhook ignored for Deal ${existingProcessedDeal.id} (Key: ${idempotencyKey})`,
      );
      return {
        success: true,
        message: 'Webhook already processed (idempotent)',
        dealId: existingProcessedDeal.id,
        state: existingProcessedDeal.state,
        idempotencyKey,
      };
    }

    // 3. Locate Target Deal by paymentOrderCode
    const deal = await this.prisma.deal.findFirst({
      where: { paymentOrderCode: BigInt(orderCode) },
      include: { order: true },
    });

    if (!deal) {
      this.logger.warn(`No Deal found matching paymentOrderCode ${orderCode}`);
      throw new NotFoundException(
        `No deal found matching paymentOrderCode ${orderCode}`,
      );
    }

    // 4. Validate State Machine Preconditions
    if (deal.state !== DealState.PENDING) {
      this.logger.warn(
        `Deal ${deal.id} is in state ${deal.state}, cannot transition to DEPOSITED`,
      );
      throw new BadRequestException(
        `Invalid deal state transition: Deal is currently in state '${deal.state}', expected 'PENDING'`,
      );
    }

    // 5. Escrow Beneficiary Account Verification (STK & Mã ngân hàng thụ hưởng)
    const expectedAccountNumber =
      process.env.ESCROW_BANK_ACCOUNT_NO ||
      process.env.PAYOS_ACCOUNT_NUMBER ||
      '998877';

    // Verify recipient account matches system escrow configuration to prevent redirection attacks
    if (
      data.accountNumber &&
      data.accountNumber.trim() !== expectedAccountNumber.trim()
    ) {
      this.logger.error(
        `[Security Alert] Tiền chuyển vào tài khoản không hợp lệ! Nhận: ${data.accountNumber}, Két ký quỹ Escrow: ${expectedAccountNumber}`,
      );
      throw new BadRequestException(
        'Tài khoản thụ hưởng không khớp với tài khoản Két ký quỹ Escrow của hệ thống.',
      );
    }

    // 6. Amount & Discrepancy Verification (Check chặt chẽ giá trị Kèo)
    const dealPrice = Math.round(Number((deal as any).price ?? deal.amount));
    const receivedAmount = Math.round(Number(data.amount));

    if (receivedAmount < dealPrice) {
      this.logger.error(
        `[Webhook Underpaid Alert] Số tiền thanh toán không đủ cho Deal ${deal.id}: Cần tối thiểu ${dealPrice} ${deal.currency}, nhưng chỉ nhận được ${receivedAmount} ${data.currency}. Từ chối chuyển trạng thái DEPOSITED.`,
      );
      throw new BadRequestException(
        `Payment amount mismatch: Số tiền thanh toán không đủ. (Yêu cầu ${dealPrice} ${deal.currency}, nhận ${receivedAmount} ${data.currency}).`,
      );
    }

    if (receivedAmount > dealPrice) {
      this.logger.error(
        `[Webhook Discrepancy Alert] Số tiền thanh toán không khớp cho Deal ${deal.id}: Yêu cầu ${dealPrice} ${deal.currency}, nhưng nhận được ${receivedAmount} ${data.currency}.`,
      );
      throw new BadRequestException(
        `Payment amount mismatch: Expected ${dealPrice} ${deal.currency}, received ${receivedAmount} ${data.currency}. Funds held in escrow.`,
      );
    }

    // 7. Atomic State Machine Transition via ACID Database Transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const depositedAt = new Date();
      const inspectionDurationSeconds = deal.inspectionDuration || 86400;
      const inspectionDeadline = new Date(
        depositedAt.getTime() + inspectionDurationSeconds * 1000,
      );

      const updatedDeal = await tx.deal.update({
        where: { id: deal.id },
        data: {
          state: DealState.DEPOSITED,
          depositedAt,
          inspectionDeadline,
          paymentRefId: data.reference,
          webhookIdempotencyKey: idempotencyKey,
        },
      });

      let updatedOrder: Order | null = null;
      if (deal.order) {
        updatedOrder = await tx.order.update({
          where: { id: deal.order.id },
          data: {
            status: OrderStatus.PAID_ESCROW,
            paymentMetadata: {
              orderCode: data.orderCode,
              reference: data.reference,
              amount: receivedAmount,
              currency: data.currency || deal.currency,
              paidAt: data.transactionDateTime || depositedAt.toISOString(),
              accountNumber: data.accountNumber,
              gateway: 'PAYOS_VIETQR',
            },
          },
        });
      }

      this.logger.log(
        `Deal ${deal.id} successfully funded and transitioned to DEPOSITED. Order status: ${updatedOrder?.status ?? 'N/A'}`,
      );

      return {
        success: true,
        message:
          'Payment verified and deal successfully transitioned to DEPOSITED',
        deal: updatedDeal,
        order: updatedOrder,
      };
    });

    if (this.supabaseService) {
      await this.supabaseService.broadcastPaymentSuccess(
        deal.id,
        DealState.DEPOSITED,
      );
    }

    return result;
  }

  /**
   * Sandbox only: Simulates successful VietQR deposit for development/testing.
   */
  async simulatePaymentSuccess(dealId: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      include: { order: true },
    });
    if (!deal) {
      throw new NotFoundException(`Deal with ID '${dealId}' not found`);
    }
    if (
      deal.state === DealState.DEPOSITED ||
      deal.state === DealState.IN_INSPECTION
    ) {
      return { success: true, message: 'Already deposited', deal };
    }

    const depositedAt = new Date();
    const inspectionDurationSeconds = deal.inspectionDuration || 86400;
    const inspectionDeadline = new Date(
      depositedAt.getTime() + inspectionDurationSeconds * 1000,
    );

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedDeal = await tx.deal.update({
        where: { id: deal.id },
        data: {
          state: DealState.DEPOSITED,
          depositedAt,
          inspectionDeadline,
          paymentRefId: `SIM_${Date.now()}`,
          webhookIdempotencyKey: `SIM_${Date.now()}`,
        },
      });

      let updatedOrder: Order | null = null;
      if (deal.order) {
        updatedOrder = await tx.order.update({
          where: { id: deal.order.id },
          data: {
            status: OrderStatus.PAID_ESCROW,
          },
        });
      }

      return {
        success: true,
        message:
          'Simulated payment verified and deal transitioned to DEPOSITED',
        deal: updatedDeal,
        order: updatedOrder,
      };
    });

    if (this.supabaseService) {
      await this.supabaseService.broadcastPaymentSuccess(
        deal.id,
        DealState.DEPOSITED,
      );
    }

    return result;
  }

  /**
   * Validates PayOS webhook signature using SDK verify and native HMAC-SHA256 fallback.
   */
  private async verifySignature(payload: PayOSWebhookDto): Promise<boolean> {
    try {
      // Primary: Official PayOS SDK verification
      await this.payOS.webhooks.verify(payload as unknown as Webhook);
      return true;
    } catch {
      // Secondary: Standard HMAC-SHA256 signature verification over sorted keys
      try {
        const key = process.env.PAYOS_CHECKSUM_KEY || this.checksumKey;
        if (!key) return false;

        const dataObj = payload.data as unknown as Record<string, unknown>;
        const sortedKeys = Object.keys(dataObj).sort();
        const queryParts: string[] = [];

        for (const k of sortedKeys) {
          const val = dataObj[k];
          if (val !== undefined && val !== null) {
            const strVal =
              typeof val === 'string'
                ? val
                : typeof val === 'number' || typeof val === 'boolean'
                  ? `${val}`
                  : JSON.stringify(val);
            queryParts.push(`${k}=${strVal}`);
          }
        }

        const queryString = queryParts.join('&');
        const calculatedSignature = crypto
          .createHmac('sha256', key)
          .update(queryString)
          .digest('hex');

        return calculatedSignature === payload.signature;
      } catch (err: any) {
        this.logger.error(`Signature computation error: ${err?.message}`);
        return false;
      }
    }
  }
}
