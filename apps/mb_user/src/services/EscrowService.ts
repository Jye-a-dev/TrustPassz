import { IEscrowService, IEscrowDeal } from '../core/interfaces';

export class EscrowService implements IEscrowService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000/api') {
    this.baseUrl = baseUrl;
  }

  async getDealDetails(dealId: string): Promise<IEscrowDeal> {
    const res = await fetch(`${this.baseUrl}/deals/${dealId}`);
    return await res.json();
  }

  async confirmDelivery(dealId: string): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/deals/${dealId}/settle`, { method: 'POST' });
    return res.ok;
  }

  async raiseDispute(dealId: string, reason: string): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/deals/${dealId}/dispute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    return res.ok;
  }
}
