export interface DealData {
  id: string;
  title: string;
  amount: number;
  currency: string;
  state: "PENDING" | "DEPOSITED" | "IN_INSPECTION" | "SETTLED" | "REFUNDED";
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
