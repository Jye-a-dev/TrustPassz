import { FiatCurrency, FiatFundingStatusEnum } from './dto/fiat-onramp.dto';

export interface FiatFundingOrderRecord {
  id: string;
  orderCode: string;
  adminId: string | null;
  recipientWallet: string;
  fiatCurrency: string;
  fiatAmount: number;
  cryptoCurrency: string;
  cryptoAmount: number;
  exchangeRate: number;
  status: FiatFundingStatusEnum;
  paymentGateway: string;
  paymentRefId: string | null;
  qrUrl: string | null;
  solanaTxHash: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export function calculateCryptoAmount(
  fiatAmount: number,
  currency: FiatCurrency,
  envVndRate?: string,
  envUsdRate?: string,
): { cryptoAmount: number; exchangeRate: number } {
  const defaultRate = currency === FiatCurrency.USD ? 180 : 4500000;
  const envVal = currency === FiatCurrency.USD ? envUsdRate : envVndRate;
  let exchangeRate = defaultRate;

  if (envVal) {
    const parsed = parseFloat(envVal);
    if (!Number.isNaN(parsed) && parsed > 0) {
      exchangeRate = parsed;
    }
  }

  const solAmount = fiatAmount / exchangeRate;
  return {
    cryptoAmount: Number(solAmount.toFixed(6)),
    exchangeRate,
  };
}

export function buildVietQrUrl(
  orderCodeNum: number,
  fiatAmount: number,
  currency: FiatCurrency,
): string {
  if (currency === FiatCurrency.VND) {
    const bankBin = '970422'; // MBBank code
    const bankAccount = '0388888888';
    const memo = encodeURIComponent(`TPZ${orderCodeNum}`);
    return `https://img.vietqr.io/image/${bankBin}-${bankAccount}-compact2.png?amount=${fiatAmount}&addInfo=${memo}&accountName=TRUSTPASSZ%20TREASURY`;
  }
  return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=USD_TRANSFER_${orderCodeNum}_AMOUNT_${fiatAmount}`;
}

