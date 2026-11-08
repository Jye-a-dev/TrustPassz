import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SettlementBankInfo {
  bankName: string;
  bankAccount: string;
  accountName: string;
  isAutoDisburse: boolean;
  isDefault: boolean;
}

export const DEFAULT_SETTLEMENT_BANK: SettlementBankInfo = {
  bankName: "MBBank (Ngân hàng TMCP Quân Đội)",
  bankAccount: "0123456789",
  accountName: "NGUYEN VAN A",
  isAutoDisburse: true,
  isDefault: true,
};

interface SettlementBankState {
  bankInfo: SettlementBankInfo;
  setBankInfo: (info: Partial<SettlementBankInfo>) => void;
  resetToDefault: () => void;
}

export const useSettlementBankStore = create<SettlementBankState>()(
  persist(
    (set) => ({
      bankInfo: DEFAULT_SETTLEMENT_BANK,
      setBankInfo: (info) =>
        set((state) => ({
          bankInfo: {
            ...state.bankInfo,
            ...info,
            isDefault: false,
          },
        })),
      resetToDefault: () => set({ bankInfo: DEFAULT_SETTLEMENT_BANK }),
    }),
    {
      name: "trustpassz-settlement-bank",
    }
  )
);
