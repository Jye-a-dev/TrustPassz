import { create } from 'zustand';
import type { Deal, UnlockedVaultPayload } from '../types';
import {
  fetchDealsList,
  fetchDealById,
  unlockDealVault,
  settleEscrowDeal,
  proposeBargain,
} from '../services/deal.service';

interface DealStateStore {
  deals: Deal[];
  activeDeal: Deal | null;
  activeVault: UnlockedVaultPayload | null;
  isLoading: boolean;
  error: string | null;
  loadDeals: () => Promise<void>;
  loadDealById: (id: string) => Promise<void>;
  proposeNewPrice: (dealId: string, price: number) => Promise<void>;
  unlockVault: (dealId: string) => Promise<UnlockedVaultPayload>;
  settleDeal: (dealId: string) => Promise<void>;
  clearActiveVault: () => void;
  setActiveDeal: (deal: Deal | null) => void;
}

export const useDealStore = create<DealStateStore>((set, get) => ({
  deals: [],
  activeDeal: null,
  activeVault: null,
  isLoading: false,
  error: null,

  loadDeals: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetchDealsList({ limit: 20 });
      set({ deals: res.data || [], isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message });
    }
  },

  loadDealById: async (id: string) => {
    try {
      const deal = await fetchDealById(id);
      set({ activeDeal: deal });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  proposeNewPrice: async (dealId: string, price: number) => {
    await proposeBargain(dealId, price);
    const current = get().activeDeal;
    if (current && current.id === dealId) {
      set({ activeDeal: { ...current, amount: price } });
    }
  },

  unlockVault: async (dealId: string) => {
    const payload = await unlockDealVault(dealId);
    set({ activeVault: payload });
    return payload;
  },

  settleDeal: async (dealId: string) => {
    await settleEscrowDeal(dealId);
    const current = get().activeDeal;
    if (current && current.id === dealId) {
      set({ activeDeal: { ...current, state: 'SETTLED' } });
    }
  },

  clearActiveVault: () => set({ activeVault: null }),
  setActiveDeal: (deal: Deal | null) => set({ activeDeal: deal }),
}));

