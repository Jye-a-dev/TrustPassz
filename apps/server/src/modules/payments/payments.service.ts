import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreatePaymentLinkResponse, PayOS, Webhook } from '@payos/node';
import { DealState, Order, OrderStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import {
  CreatePaymentLinkDto,
  PayOSWebhookDto,
} from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly payOS: PayOS;
  private readonly checksumKey: string;

  constructor(private readonly prisma: PrismaService) {
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
  async createPaymentLink(dealId: string, dto?: CreatePaymentLinkDto) {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      include: { order: true, buyer: true, seller: true },
    });

    if (!deal) {
      throw new NotFoundException(`Deal with ID '${dealId}' not found`);
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
    const amountNumber = Math.round(Number(deal.amount));

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

    const bin = gatewayResponse?.bin || '970422';
    const accountNumber = gatewayResponse?.accountNumber || '998877';
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
      this.logger.warn(
        `No Deal found matching paymentOrderCode ${orderCode}`,
      );
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

    // 5. Amount & Discrepancy Verification
    const expectedAmount = Math.round(Number(deal.amount));
    const receivedAmount = Math.round(Number(data.amount));

    if (receivedAmount !== expectedAmount) {
      this.logger.error(
        `Payment amount mismatch for Deal ${deal.id}: Expected ${expectedAmount}, received ${receivedAmount}`,
      );
      throw new BadRequestException(
        `Payment amount mismatch: Expected ${expectedAmount} ${deal.currency}, received ${receivedAmount} ${data.currency}. Funds held in escrow.`,
      );
    }

    // 6. Atomic State Machine Transition via ACID Database Transaction
    return this.prisma.$transaction(async (tx) => {
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
        message: 'Payment verified and deal successfully transitioned to DEPOSITED',
        deal: updatedDeal,
        order: updatedOrder,
      };
    });
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
            queryParts.push(`${k}=${val}`);
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
