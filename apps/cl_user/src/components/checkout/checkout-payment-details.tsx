"use client";

import * as React from "react";
import { Copy, Check, ShieldCheck, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BankConfig } from "./checkout.types";

interface CheckoutPaymentDetailsProps {
  bankConfig: BankConfig;
  copiedField: string | null;
  onCopy: (text: string, fieldName: string, label: string) => void;
}

export function CheckoutPaymentDetails({
  bankConfig,
  copiedField,
  onCopy,
}: CheckoutPaymentDetailsProps) {
  return (
    <div className="md:col-span-7 space-y-4">
      {/* Amount Box */}
      <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Số tiền cần ký quỹ
          </span>
          <span className="font-mono text-2xl sm:text-3xl font-black text-cyan-400">
            {bankConfig.amount.toLocaleString("vi-VN")} ₫
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onCopy(String(bankConfig.amount), "amount", "số tiền")
          }
          className="min-h-11 border-cyan-500/40 bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900/60 text-xs font-bold gap-1.5 cursor-pointer"
        >
          {copiedField === "amount" ? (
            <Check className="size-4 text-emerald-400" />
          ) : (
            <Copy className="size-4" />
          )}
          <span>Sao chép</span>
        </Button>
      </div>

      {/* Account Information Rows */}
      <div className="space-y-2 text-xs">
        {/* Row 1: Bank Name */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">
              Ngân hàng thụ hưởng
            </span>
            <span className="font-medium text-slate-200">
              {bankConfig.bankName}
            </span>
          </div>
          <Badge
            variant="outline"
            className="font-mono text-[10px] border-slate-700 text-slate-400"
          >
            BIN: {bankConfig.bin}
          </Badge>
        </div>

        {/* Row 2: Account Number */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">
              Số tài khoản
            </span>
            <span className="font-mono font-bold text-base text-white">
              {bankConfig.accountNo}
            </span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              onCopy(bankConfig.accountNo, "account", "số tài khoản")
            }
            className="min-h-11 text-slate-300 hover:text-white text-xs gap-1.5 cursor-pointer"
          >
            {copiedField === "account" ? (
              <Check className="size-4 text-emerald-400" />
            ) : (
              <Copy className="size-4" />
            )}
            <span>Chép STK</span>
          </Button>
        </div>

        {/* Row 3: Account Name */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">
              Chủ tài khoản
            </span>
            <span className="font-bold text-slate-200 uppercase">
              {bankConfig.accountName}
            </span>
          </div>
          <ShieldCheck className="size-4 text-emerald-400" />
        </div>

        {/* Row 4: Memo Transfer Syntax (Crucial!) */}
        <div className="p-3 rounded-xl bg-linear-to-r from-amber-950/30 to-slate-950 border border-amber-500/40 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-amber-300 font-bold uppercase block tracking-wider">
              Nội dung chuyển khoản (Bắt buộc chính xác)
            </span>
            <span className="font-mono font-black text-base text-amber-400">
              {bankConfig.memo}
            </span>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() =>
              onCopy(bankConfig.memo, "memo", "nội dung chuyển khoản")
            }
            className="min-h-11 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs gap-1.5 shadow-md cursor-pointer"
          >
            {copiedField === "memo" ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
            <span>Chép cú pháp</span>
          </Button>
        </div>
      </div>

      {/* Mobile App Deeplink Action */}
      <div className="pt-2 flex flex-col sm:flex-row gap-3">
        <Button
          asChild
          className="flex-1 min-h-12 bg-linear-to-r from-emerald-500 via-cyan-500 to-emerald-400 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm shadow-lg shadow-cyan-950/50 cursor-pointer"
        >
          <a href={bankConfig.deepLink}>
            <Smartphone className="size-4 mr-2" />
            Mở App Ngân Hàng Trên Điện Thoại
          </a>
        </Button>
      </div>
    </div>
  );
}
