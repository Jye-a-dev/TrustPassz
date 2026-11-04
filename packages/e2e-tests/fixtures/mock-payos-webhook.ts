import * as crypto from 'crypto';

export interface PayOSWebhookData {
  orderCode: number;
  amount: number;
  description: string;
  accountNumber: string;
  reference: string;
  transactionDateTime: string;
  currency: string;
  paymentLinkId: string;
  code: string;
  desc: string;
  counterAccountBankId?: string | null;
  counterAccountBankName?: string | null;
  counterAccountName?: string | null;
  counterAccountNumber?: string | null;
  virtualAccountName?: string | null;
  virtualAccountNumber?: string | null;
}

export interface PayOSWebhookPayload {
  code: string;
  desc: string;
  success?: boolean;
  data: PayOSWebhookData;
  signature: string;
}

export const DEFAULT_MOCK_CHECKSUM_KEY =
  process.env.PAYOS_CHECKSUM_KEY || 'mock_checksum_key_1234567890';

/**
 * Computes official PayOS HMAC-SHA256 signature by sorting key=value pairs alphabetically.
 */
export function calculatePayOSSignature(
  data: Record<string, unknown>,
  checksumKey: string = DEFAULT_MOCK_CHECKSUM_KEY,
): string {
  const sortedKeys = Object.keys(data).sort();
  const queryParts: string[] = [];

  for (const key of sortedKeys) {
    const val = data[key];
    if (val !== undefined && val !== null) {
      queryParts.push(`${key}=${val}`);
    }
  }

  const queryString = queryParts.join('&');
  return crypto
    .createHmac('sha256', checksumKey)
    .update(queryString)
    .digest('hex');
}

/**
 * Constructs a valid PayOS VietQR deposit webhook with cryptographic HMAC signature.
 */
export function createMockPayOSWebhook(
  params: {
    orderCode: number;
    amount: number;
    reference?: string;
    description?: string;
    accountNumber?: string;
    currency?: string;
    paymentLinkId?: string;
    checksumKey?: string;
  },
): PayOSWebhookPayload {
  const checksumKey = params.checksumKey || DEFAULT_MOCK_CHECKSUM_KEY;
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const formattedDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const data: PayOSWebhookData = {
    orderCode: params.orderCode,
    amount: params.amount,
    description: params.description || `Deal ${params.orderCode}`,
    accountNumber: params.accountNumber || '998877',
    reference: params.reference || `FT${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`,
    transactionDateTime: formattedDate,
    currency: params.currency || 'VND',
    paymentLinkId: params.paymentLinkId || `pl_${params.orderCode}`,
    code: '00',
    desc: 'Success',
    counterAccountBankId: '970422',
    counterAccountBankName: 'MBBank',
    counterAccountName: 'NGUYEN VAN BUYER',
    counterAccountNumber: '0388999888',
    virtualAccountName: null,
    virtualAccountNumber: null,
  };

  const signature = calculatePayOSSignature(data as unknown as Record<string, unknown>, checksumKey);

  return {
    code: '00',
    desc: 'Success',
    success: true,
    data,
    signature,
  };
}

/**
 * Creates an identical webhook payload to test idempotency and replay attack prevention.
 */
export function createReplayWebhook(original: PayOSWebhookPayload): PayOSWebhookPayload {
  return JSON.parse(JSON.stringify(original));
}

/**
 * Creates a tampered webhook payload with corrupted signature or modified amount.
 */
export function createTamperedWebhook(
  original: PayOSWebhookPayload,
  tamperedAmount?: number,
): PayOSWebhookPayload {
  const cloned = JSON.parse(JSON.stringify(original)) as PayOSWebhookPayload;
  if (tamperedAmount !== undefined) {
    cloned.data.amount = tamperedAmount;
  } else {
    cloned.signature = 'deadbeef00000000000000000000000000000000000000000000000000000000';
  }
  return cloned;
}
