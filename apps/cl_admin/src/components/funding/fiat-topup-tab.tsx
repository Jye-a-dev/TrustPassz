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
      <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-4 text-center space-y-3">
        <div className="font-mono text-xs text-amber-400 flex items-center justify-center gap-1.5 font-semibold">
          <QrCode className="h-4 w-4" />
          <span>Đơn Nạp #{activeOrder.orderCode} ({activeOrder.status})</span>
        </div>

        {activeOrder.qrUrl && (
          <div className="flex justify-center py-1">
            <img
              src={activeOrder.qrUrl}
              alt="VietQR Invoice"
              className="w-48 h-48 rounded-lg border border-slate-700 bg-white p-2"
            />
          </div>
        )}

        <div className="text-xs font-mono text-slate-300">
          Số tiền:{' '}
          <strong className="text-amber-400">
            {activeOrder.fiatAmount.toLocaleString('vi-VN')} {activeOrder.fiatCurrency}
          </strong>{' '}
          → <strong className="text-emerald-400">{activeOrder.cryptoAmount} SOL</strong>
        </div>

        {activeOrder.status === 'FULFILLED' ? (
          <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-800 text-emerald-400 font-mono text-xs flex items-center justify-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            <span>Đã giải ngân on-chain! Tx: {activeOrder.solanaTxHash?.slice(0, 10)}...</span>
          </div>
        ) : (
          <Button
            type="button"
            disabled={isMockPaying}
            onClick={handleSimulatePayment}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white min-h-[44px] text-xs font-mono gap-1.5"
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
          className="text-xs text-slate-400 min-h-[44px]"
        >
          Tạo đơn nạp khác
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={fiatCurrency === 'VND' ? 'default' : 'outline'}
          onClick={() => {
            setFiatCurrency('VND');
            setFiatAmount(100000);
          }}
          className={`flex-1 min-h-[44px] text-xs font-mono ${
            fiatCurrency === 'VND' ? 'bg-amber-600 hover:bg-amber-500' : 'border-slate-800 bg-slate-900'
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
          className={`flex-1 min-h-[44px] text-xs font-mono ${
            fiatCurrency === 'USD' ? 'bg-amber-600 hover:bg-amber-500' : 'border-slate-800 bg-slate-900'
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
            className="border-slate-800 bg-slate-900 text-xs min-h-[44px] font-mono"
          >
            {fiatCurrency === 'VND' ? `${amt.toLocaleString('vi-VN')} đ` : `$${amt}`}
          </Button>
        ))}
      </div>

      <div className="rounded-lg border border-slate-800 bg-[#0F172A] p-3 space-y-1 font-mono text-[11px]">
        <div className="flex justify-between text-slate-400">
          <span>Tỷ giá quy đổi dự kiến:</span>
          <span className="text-cyan-400">
            {fiatCurrency === 'VND' ? '1 SOL = 4.500.000 VNĐ' : '1 SOL = $180 USD'}
          </span>
        </div>
        <div className="flex justify-between text-slate-200 font-semibold">
          <span>Lượng SOL nhận được:</span>
          <span className="text-emerald-400">~{expectedSol} SOL</span>
        </div>
      </div>

      <Button
        type="button"
        disabled={isCreatingOrder}
        onClick={handleCreateFiatOrder}
        className="w-full bg-amber-600 hover:bg-amber-500 text-white min-h-[44px] text-xs font-mono gap-1.5"
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

