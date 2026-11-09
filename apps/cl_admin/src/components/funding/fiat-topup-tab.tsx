'use client';

import * as React from 'react';
import {
  CheckCircle2,
  Loader2,
  QrCode,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import type { FiatFundingOrderRecord } from '@/types';
import { toast } from 'sonner';

interface FiatTopupTabProps {
  relayerAddress: string;
  onSuccessFund?: () => void;
}

export function FiatTopupTab({
  relayerAddress,
  onSuccessFund,
}: FiatTopupTabProps) {
  const [fiatCurrency, setFiatCurrency] = React.useState<'VND' | 'USD'>('VND');
  const [fiatAmount, setFiatAmount] = React.useState<number>(100000);
  const [isCreatingOrder, setIsCreatingOrder] = React.useState(false);
  const [activeOrder, setActiveOrder] = React.useState<FiatFundingOrderRecord | null>(null);
  const [isMockPaying, setIsMockPaying] = React.useState(false);

  const handleCreateFiatOrder = async () => {
    setIsCreatingOrder(true);
    try {
      const order = await apiClient<FiatFundingOrderRecord>(
        '/api/v1/admin/fiat-onramp/order',
        {
          method: 'POST',
          body: JSON.stringify({
            recipientWallet: relayerAddress,
            fiatAmount,
            fiatCurrency,
          }),
        },
      );
      setActiveOrder(order);
      toast.success('Đã tạo mã đơn nạp VietQR/USD thành công');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi tạo đơn nạp fiat';
      toast.error(msg);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!activeOrder) return;
    setIsMockPaying(true);
    try {
      const res = await apiClient<FiatFundingOrderRecord>(
        `/api/v1/admin/fiat-onramp/mock-pay/${activeOrder.orderCode}`,
        { method: 'POST' },
      );
      setActiveOrder(res);
      toast.success(`Thanh toán thành công! Đã giải ngân ${res.cryptoAmount} SOL từ Quỹ trung tâm.`);
      onSuccessFund?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi mô phỏng thanh toán';
      toast.error(msg);
    } finally {
      setIsMockPaying(false);
    }
  };

  const expectedSol = (fiatAmount / (fiatCurrency === 'VND' ? 4500000 : 180)).toFixed(4);

  if (activeOrder) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center space-y-3">
        <div className="font-mono text-xs text-amber-700 flex items-center justify-center gap-1.5 font-bold">
          <QrCode className="h-4 w-4" />
          <span>Đơn Nạp #{activeOrder.orderCode} ({activeOrder.status})</span>
        </div>

        {activeOrder.qrUrl && (
          <div className="flex justify-center py-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeOrder.qrUrl}
              alt="VietQR Invoice"
              className="w-48 h-48 rounded-xl border border-slate-200 bg-white p-2 shadow-xs"
            />
          </div>
        )}

        <div className="text-xs font-mono text-slate-700">
          Số tiền:{' '}
          <strong className="text-slate-900 font-bold">
            {activeOrder.fiatAmount.toLocaleString('vi-VN')} {activeOrder.fiatCurrency}
          </strong>{' '}
          → <strong className="text-emerald-700 font-bold">{activeOrder.cryptoAmount} SOL</strong>
        </div>

        {activeOrder.status === 'FULFILLED' ? (
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-xs flex items-center justify-center gap-1.5 font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Đã giải ngân on-chain! Tx: {activeOrder.solanaTxHash?.slice(0, 10)}...</span>
          </div>
        ) : (
          <Button
            type="button"
            disabled={isMockPaying}
            onClick={handleSimulatePayment}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-10 text-xs font-medium gap-1.5 rounded-xl"
          >
            {isMockPaying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span>Giả Lập Thanh Toán Thành Công (Mock Pay)</span>
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setActiveOrder(null)}
          className="text-xs text-slate-500 hover:text-slate-800 h-9"
        >
          Tạo đơn nạp khác
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 py-1">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={fiatCurrency === 'VND' ? 'default' : 'outline'}
          onClick={() => {
            setFiatCurrency('VND');
            setFiatAmount(100000);
          }}
          className={`flex-1 h-10 text-xs font-medium rounded-lg ${
            fiatCurrency === 'VND'
              ? 'bg-slate-900 text-white hover:bg-slate-800'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          Tiền Việt (VNĐ - VietQR)
        </Button>
        <Button
          type="button"
          variant={fiatCurrency === 'USD' ? 'default' : 'outline'}
          onClick={() => {
            setFiatCurrency('USD');
            setFiatAmount(20);
          }}
          className={`flex-1 h-10 text-xs font-medium rounded-lg ${
            fiatCurrency === 'USD'
              ? 'bg-slate-900 text-white hover:bg-slate-800'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          Đô La Mỹ (USD)
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(fiatCurrency === 'VND' ? [100000, 200000, 500000] : [10, 25, 50]).map((amt) => (
          <Button
            key={amt}
            type="button"
            variant={fiatAmount === amt ? 'secondary' : 'outline'}
            onClick={() => setFiatAmount(amt)}
            className={`h-10 text-xs font-mono font-medium rounded-lg border ${
              fiatAmount === amt
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {fiatCurrency === 'VND' ? `${amt.toLocaleString('vi-VN')} đ` : `$${amt}`}
          </Button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1 font-mono text-xs">
        <div className="flex justify-between text-slate-500 text-[11px]">
          <span>Tỷ giá quy đổi dự kiến:</span>
          <span className="font-semibold text-slate-700">
            {fiatCurrency === 'VND' ? '1 SOL = 4.500.000 VNĐ' : '1 SOL = $180 USD'}
          </span>
        </div>
        <div className="flex justify-between text-slate-800 font-semibold text-xs pt-0.5">
          <span>Lượng SOL nhận được:</span>
          <span className="text-emerald-700 font-bold">~{expectedSol} SOL</span>
        </div>
      </div>

      <Button
        type="button"
        disabled={isCreatingOrder}
        onClick={handleCreateFiatOrder}
        className="w-full bg-slate-900 hover:bg-slate-800 text-white h-10 text-xs font-medium gap-1.5 rounded-xl shadow-xs"
      >
        {isCreatingOrder ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <QrCode className="h-4 w-4" />
        )}
        <span>Sinh Mã VietQR / Invoice Nạp Vốn</span>
      </Button>
    </div>
  );
}
