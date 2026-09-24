export interface IEscrowDeal {
  dealId: string;
  title: string;
  amount: number;
  currency: 'VND' | 'USDC';
  inspectionHours: number;
  status: 'Pending' | 'Deposited' | 'InInspection' | 'Settled' | 'Disputed';
}

export interface IEscrowService {
  getDealDetails(dealId: string): Promise<IEscrowDeal>;
  confirmDelivery(dealId: string): Promise<boolean>;
  raiseDispute(dealId: string, reason: string): Promise<boolean>;
}
