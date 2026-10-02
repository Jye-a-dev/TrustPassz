import { apiClient } from './apiClient';
import type { Deal, UnlockedVaultPayload } from '../types';

export async function fetchDealsList(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<{ data: Deal[]; meta: { total: number; page: number; limit: number } }> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', params.page.toString());
  if (params?.limit) query.set('limit', params.limit.toString());
  if (params?.status) query.set('status', params.status);

  const qs = query.toString() ? `?${query.toString()}` : '';
  const response = await apiClient<{ data: Deal[]; meta: { total: number; page: number; limit: number } }>(
    `/api/v1/deals${qs}`,
    { method: 'GET' }
  );
  return response;
}

export async function fetchDealById(id: string): Promise<Deal> {
  return apiClient<Deal>(`/api/v1/deals/${id}`, { method: 'GET' });
}

export async function unlockDealVault(dealId: string): Promise<UnlockedVaultPayload> {
  return apiClient<UnlockedVaultPayload>(`/api/v1/deals/${dealId}/vault/unlock`, {
    method: 'POST',
  });
}

export async function settleEscrowDeal(dealId: string): Promise<{ success: boolean; message: string }> {
  return apiClient<{ success: boolean; message: string }>(`/api/v1/deals/${dealId}/settle`, {
    method: 'POST',
  });
}

export async function proposeBargain(dealId: string, offeredAmount: number, message?: string): Promise<{ id: string; status: string }> {
  return apiClient<{ id: string; status: string }>(`/api/v1/bargains`, {
    method: 'POST',
    body: JSON.stringify({
      dealId,
      offerPrice: offeredAmount,
      message: message || `Khách hàng đề xuất mức giá: ${offeredAmount.toLocaleString('vi-VN')} VND`,
      expiresInHours: 24,
    }),
  });
}

