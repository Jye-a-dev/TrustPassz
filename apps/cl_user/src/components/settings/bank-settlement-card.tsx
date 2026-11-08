"use client";

import * as React from "react";
import { CreditCard, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSettlementBankStore } from "@/lib/settlement-bank-store";
import { cn } from "@/lib/utils";

export function BankSettlementCard() {
  const { bankInfo, setBankInfo } = useSettlementBankStore();

  const [bankName, setBankName] = React.useState(bankInfo.bankName);
  const [bankAccount, setBankAccount] = React.useState(bankInfo.bankAccount);
  const [accountName, setAccountName] = React.useState(bankInfo.accountName);
  const [autoDisburse, setAutoDisburse] = React.useState(bankInfo.isAutoDisburse);
  const [isSavingBank, setIsSavingBank] = React.useState(false);

  React.useEffect(() => {
    setBankName(bankInfo.bankName);
    setBankAccount(bankInfo.bankAccount);
    setAccountName(bankInfo.accountName);
    setAutoDisburse(bankInfo.isAutoDisburse);
  }, [bankInfo]);

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankAccount.trim() || !accountName.trim() || !bankName.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin tài khoản giải ngân.");
      return;
    }

    setIsSavingBank(true);
    setTimeout(() => {
      setBankInfo({
        bankName: bankName.trim(),
        bankAccount: bankAccount.trim(),
        accountName: accountName.trim().toUpperCase(),
        isAutoDisburse: autoDisburse,
        isDefault: false,
      });
      setIsSavingBank(false);
      toast.success("Đã cập nhật STK VietQR nhận tiền giải ngân thành công!");
    }, 500);
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-5 shadow-sm">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 shrink-0">
          <CreditCard className="size-5" />
        </div>
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            STK Ngân Hàng Nhận Tiền Giải Ngân
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tiền bán sẽ tự động giải ngân về STK này ngay khi người mua nghiệm thu xong.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveBank} className="space-y-4 text-xs">
        <div className="space-y-1.5">
          <label className="text-slate-800 dark:text-slate-200 font-bold block font-mono text-xs uppercase">
            Ngân hàng thụ hưởng <span className="text-rose-600">*</span>
          </label>
          <Input
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="Ví dụ: MBBank (Ngân hàng TMCP Quân Đội)"
            className="w-full min-h-11 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 shadow-2xs"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-slate-800 dark:text-slate-200 font-bold block font-mono text-xs uppercase">
            Số tài khoản (STK) <span className="text-rose-600">*</span>
          </label>
          <Input
            value={bankAccount}
            onChange={(e) => setBankAccount(e.target.value)}
            placeholder="Ví dụ: 0123456789"
            className="w-full min-h-11 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-sm text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 shadow-2xs"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-slate-800 dark:text-slate-200 font-bold block font-mono text-xs uppercase">
            Họ và tên chủ thẻ (in hoa không dấu) <span className="text-rose-600">*</span>
          </label>
          <Input
            value={accountName}
            onChange={(e) => setAccountName(e.target.value.toUpperCase())}
            placeholder="Ví dụ: NGUYEN VAN A"
            className="w-full min-h-11 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 uppercase text-sm text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 shadow-2xs"
            required
          />
        </div>

        <div
          onClick={() => setAutoDisburse(!autoDisburse)}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-3 cursor-pointer select-none"
        >
          <div>
            <span className="font-bold text-slate-900 dark:text-white block text-xs">
              Tự động tất toán về tài khoản VietQR
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Chuyển thẳng về STK VietQR ngay khi hết thời gian đồng kiểm, không cần rút thủ công.
            </span>
          </div>
          <div
            className={cn(
              "w-12 h-7 rounded-full p-0.5 flex items-center cursor-pointer shadow-xs shrink-0 transition-colors",
              autoDisburse ? "bg-emerald-600 justify-end" : "bg-slate-300 dark:bg-slate-700 justify-start"
            )}
          >
            <div className="size-6 rounded-full bg-white shadow-md" />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSavingBank}
          className="w-full min-h-12 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs sm:text-sm shadow-md mt-4 flex items-center justify-center gap-2 transition-all border border-rose-600 cursor-pointer"
        >
          <Save className="size-4" />
          <span>{isSavingBank ? "Đang lưu..." : "Lưu STK Nhận Tiền Giải Ngân"}</span>
        </Button>
      </form>
    </div>
  );
}
