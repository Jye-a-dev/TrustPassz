import * as crypto from 'crypto';
import { Webhook, PayOS } from '@payos/node';
import { DealState, Order, OrderStatus } from '@prisma/client';
import { PayOSWebhookDto } from './dto/payment.dto';
import { PrismaService } from '../../database/prisma.service';

/**
 * Validates HMAC-SHA256 signature from PayOS webhook payload with SDK verification and fallback.
 */
export async function verifyPayOsSignature(
  payOS: PayOS,
  payload: PayOSWebhookDto,
  checksumKey: string,
): Promise<boolean> {
  try {
    await payOS.webhooks.verify(payload as unknown as Webhook);
    return true;
  } catch {
    try {
      const key = process.env.PAYOS_CHECKSUM_KEY || checksumKey;
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
    } catch {
      return false;
    }
  }
}

/**
 * Executes atomic simulation transaction for sandbox testing.
 */
export async function executeSimulatedDeposit(
  prisma: PrismaService,
  deal: { id: string; inspectionDuration?: number | null; order?: { id: string } | null },
) {
  const depositedAt = new Date();
  const inspectionDurationSeconds = deal.inspectionDuration || 86400;
  const inspectionDeadline = new Date(
    depositedAt.getTime() + inspectionDurationSeconds * 1000,
  );
  const simKey = `SIM_${Date.now()}`;

  return prisma.$transaction(async (tx) => {
    const updatedDeal = await tx.deal.update({
      where: { id: deal.id },
      data: {
        state: DealState.DEPOSITED,
        depositedAt,
        inspectionDeadline,
        paymentRefId: simKey,
        webhookIdempotencyKey: simKey,
      },
    });

    let updatedOrder: Order | null = null;
    if (deal.order) {
      updatedOrder = await tx.order.update({
        where: { id: deal.order.id },
        data: { status: OrderStatus.PAID_ESCROW },
      });
    }

    return {
      success: true,
      message: 'Simulated payment verified and deal transitioned to DEPOSITED',
      deal: updatedDeal,
      order: updatedOrder,
    };
  });
}
