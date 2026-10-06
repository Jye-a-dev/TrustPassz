export interface DealData {
  id: string;
  title: string;
  amount?: number | string;
  price?: number | string;
  currency: string;
  state: "PENDING" | "DEPOSITED" | "IN_INSPECTION" | "SETTLED" | "REFUNDED" | "DISPUTED";
  inspectionDuration: number;
  seller?: {
    id: string;
    displayName: string;
  };
  orderCode?: number;
}

export interface BankConfig {
  bin: string;
  bankName: string;
  accountNo: string;
  accountName: string;
  amount: number;
  memo: string;
  vietQrUrl: string;
  deepLink: string;
}
