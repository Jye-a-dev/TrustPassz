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
import { PrismaService } from '../../../database/prisma.service';
import { SupabaseService } from '../../../integrations/supabase/supabase.service';
import { RequestUser } from '../../../common/decorators/current-user.decorator';
import {
  CreateVietQrCheckoutDto,
  PayOSWebhookDto,
  VietQrCheckoutResponseDto,
} from '../dto/payment.dto';
import { EmergencyAlertService } from '../../emergency-alert/emergency-alert.service';

@Injectable()
export class VietQrService {
  private readonly logger = new Logger(VietQrService.name);
  private readonly payOS: PayOS;
  private readonly checksumKey: string;
  private consecutiveWebhookFailures = 0;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly supabaseService?: SupabaseService,
    @Optional() private readonly emergencyAlertService?: EmergencyAlertService,
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
   * Generates dynamic VietQR payment link and checkout session via PayOS SDK.
   */
  async createCheckout(
    dto: CreateVietQrCheckoutDto,
    currentUser?: RequestUser,
  ): Promise<VietQrCheckoutResponseDto> {
    const { dealId } = dto;
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        order: { include: { product: true } },
        buyer: true,
        seller: true,
      },
    });

    if (!deal) {
      throw new NotFoundException(`Deal with ID '${dealId}' not found`);
    }

    if (currentUser && currentUser.id === deal.sellerId) {
      throw new ForbiddenException(
        'Người bán không thể tự nạp tiền hoặc thanh toán cho sản phẩm của chính mình.',
      );
    }

    // Xác thực giá tiền đối với deal giảm giá thấp hơn basePrice của sản phẩm
    const product = deal.order?.product;
    if (product && Number(deal.amount) < Number(product.basePrice)) {
      if (!deal.buyerId) {
        throw new ForbiddenException('Mức giá chưa được người bán chấp thuận. Không thể tạo link thanh toán.');
      }
      const acceptedOffer = await this.prisma.bargainOffer.findFirst({
        where: { productId: product.id, buyerId: deal.buyerId, offeredPrice: deal.amount, status: 'ACCEPTED' },
      });
      if (!acceptedOffer) {
        throw new ForbiddenException('Mức giá chưa được người bán chấp thuận. Không thể tạo link thanh toán.');
      }
    }

    if (deal.state !== DealState.PENDING) {
      throw new BadRequestException(
        `Không thể tạo link nạp tiền: Deal đang ở trạng thái '${deal.state}' (chỉ áp dụng cho PENDING)`,
      );
    }

    // Generate safe positive integer orderCode (max: 9007199254740991 for JavaScript Safe Integer)
    const timestampPart = Date.now() % 1000000000;
    const randomPart = Math.floor(100 + Math.random() * 900);
    const orderCode = Number(`${timestampPart}${randomPart}`);

    const returnUrl =
      dto.returnUrl ||
      process.env.PAYOS_RETURN_URL ||
      'https://trustpassz.io/checkout/success';
    const cancelUrl =
      dto.cancelUrl ||
      process.env.PAYOS_CANCEL_URL ||
      'https://trustpassz.io/checkout/cancel';

    // PayOS requires description length <= 25 characters
    const memo = `TPZ ${deal.id.slice(0, 8)}`;
    const description = (dto.description || memo).slice(0, 25);
    const amountNumber = Math.round(Number((deal as any).price ?? deal.amount));

    let gatewayResponse: Partial<CreatePaymentLinkResponse> | null = null;

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
        `PayOS SDK call error: ${error?.message || error}. Falling back to dynamic VietQR standard format.`,
      );
    }

    // Atomically link paymentOrderCode into Deal model
    await this.prisma.deal.update({
      where: { id: deal.id },
      data: {
        paymentOrderCode: BigInt(orderCode),
      },
    });

    const bin = gatewayResponse?.bin || process.env.ESCROW_BANK_BIN || '970422';
    const accountNumber = gatewayResponse?.accountNumber || process.env.ESCROW_BANK_ACCOUNT_NO || process.env.PAYOS_ACCOUNT_NUMBER || '998877';
    const accountName = gatewayResponse?.accountName || 'TRUSTPASSZ ESCROW';
    const paymentUrl = gatewayResponse?.checkoutUrl || `https://pay.payos.vn/web/${orderCode}`;
    const qrCodeUrl = gatewayResponse?.qrCode || `https://img.vietqr.io/image/${bin}-${accountNumber}-compact2.png?amount=${amountNumber}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(accountName)}`;

    return {
      qrCodeUrl,
      paymentUrl,
      orderCode,
      amount: amountNumber,
      memo,
      bin,
      accountNumber,
      accountName,
      status: gatewayResponse?.status || 'PENDING',
    };
  }

  private async onWebhookFailure(reason: string, payload?: PayOSWebhookDto): Promise<void> {
    this.consecutiveWebhookFailures++;
    this.logger.warn(`VietQR/PayOS webhook failure #${this.consecutiveWebhookFailures}: ${reason}`);
    if (this.consecutiveWebhookFailures >= 3 && this.emergencyAlertService) {
      await this.emergencyAlertService.triggerCriticalAlert({
        service: 'VietQrService (PayOS/VietQR Webhook)',
        errorCode: 'PAYOS_WEBHOOK_CONSECUTIVE_FAILURES',
        summary: 'Webhook VietQR (PayOS) Thất Bại Liên Tiếp >= 3 Lần',
        message: `Hệ thống ghi nhận ${this.consecutiveWebhookFailures} lần parse/verify webhook thất bại liên tiếp: ${reason}. Cần kiểm tra ngay kết nối hoặc checksum key.`,
        metadata: {
          consecutiveFailures: this.consecutiveWebhookFailures,
          orderCode: payload?.data?.orderCode,
          reason,
        },
      });
    }
  }

  /**
   * Processes PayOS webhook with HMAC-SHA256 verification and atomic state transition.
   */
  async handleWebhook(payload: PayOSWebhookDto) {
    if (!payload || !payload.data || !payload.signature) {
      await this.onWebhookFailure('Missing data or cryptographic signature', payload);
      throw new BadRequestException(
        'Webhook payload không hợp lệ: Thiếu data hoặc chữ ký mã hóa',
      );
    }

    // 1. Verify HMAC-SHA256 signature
    const isSignatureValid = await this.verifySignature(payload);
    if (!isSignatureValid) {
      await this.onWebhookFailure(`Invalid HMAC signature for orderCode ${payload.data.orderCode}`, payload);
      this.logger.error(
        `Chữ ký HMAC-SHA256 không hợp lệ cho orderCode ${payload.data.orderCode}`,
      );
      throw new BadRequestException(
        'HMAC-SHA256 signature verification failed. Untrusted webhook origin.',
      );
    }

    this.consecutiveWebhookFailures = 0;

    const { data } = payload;
    const orderCode = data.orderCode;
    const idempotencyKey =
      data.reference || `payos_${orderCode}_${data.amount}`;

    // 2. Anti-Replay: Idempotency deduplication check
    const existingProcessedDeal = await this.prisma.deal.findFirst({
      where: { webhookIdempotencyKey: idempotencyKey },
    });

    if (existingProcessedDeal) {
      this.logger.log(
        `Bỏ qua webhook trùng lặp (Idempotent) cho Deal ${existingProcessedDeal.id} (Key: ${idempotencyKey})`,
      );
      return {
        success: true,
        message: 'Webhook already processed (idempotent)',
        dealId: existingProcessedDeal.id,
        state: existingProcessedDeal.state,
        idempotencyKey,
      };
    }

    // 3. Find target deal by paymentOrderCode
    const deal = await this.prisma.deal.findFirst({
      where: { paymentOrderCode: BigInt(orderCode) },
      include: { order: true },
    });

    if (!deal) {
      this.logger.warn(`Không tìm thấy Deal khớp với orderCode ${orderCode}`);
      throw new NotFoundException(
        `No deal found matching paymentOrderCode ${orderCode}`,
      );
    }

    // 4. Validate deal state
    if (deal.state !== DealState.PENDING) {
      if (
        deal.state === DealState.DEPOSITED ||
        deal.state === DealState.IN_INSPECTION
      ) {
        return {
          success: true,
          message: 'Deal already deposited (idempotent)',
          dealId: deal.id,
          state: deal.state,
        };
      }
      throw new BadRequestException(
        `Invalid deal state transition: Deal is in state '${deal.state}', expected 'PENDING'`,
      );
    }

    // 5. Escrow beneficiary account verification
    const expectedAccountNumber =
      process.env.ESCROW_BANK_ACCOUNT_NO ||
      process.env.PAYOS_ACCOUNT_NUMBER ||
      '998877';

    if (
      data.accountNumber &&
      data.accountNumber.trim() !== expectedAccountNumber.trim()
    ) {
      this.logger.error(
        `[Security Alert] Chuyển khoản sai tài khoản két Escrow! Nhận: ${data.accountNumber}, Hệ thống: ${expectedAccountNumber}`,
      );
      throw new BadRequestException(
        'Tài khoản thụ hưởng không khớp với tài khoản Két ký quỹ Escrow của hệ thống.',
      );
    }

    // 6. Validate deposit amount: amount >= deal.amount
    const dealPrice = Math.round(Number((deal as any).price ?? deal.amount));
    const receivedAmount = Math.round(Number(data.amount));

    if (receivedAmount !== dealPrice) {
      this.logger.error(
        `[Webhook Discrepancy Alert] Số tiền thanh toán không khớp cho Deal ${deal.id}: Cần chính xác ${dealPrice} ${deal.currency}, nhận ${receivedAmount} ${data.currency}.`,
      );
      throw new BadRequestException(
        `Payment amount mismatch: Số tiền thanh toán không khớp với Kèo đã phê duyệt. (Yêu cầu ${dealPrice} ${deal.currency}, nhận ${receivedAmount} ${data.currency}).`,
      );
    }

    // 7. Atomic transaction for Deal state transition & Order payment update
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
        `Deal ${deal.id} nạp tiền VietQR thành công -> DEPOSITED. Order: ${updatedOrder?.status ?? 'N/A'}`,
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
   * Cryptographic verification using PayOS SDK with native HMAC-SHA256 fallback.
   */
  private async verifySignature(payload: PayOSWebhookDto): Promise<boolean> {
    try {
      await this.payOS.webhooks.verify(payload as unknown as Webhook);
      return true;
    } catch {
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
        this.logger.error(`Lỗi tính chữ ký HMAC: ${err?.message}`);
        return false;
      }
    }
  }
}

