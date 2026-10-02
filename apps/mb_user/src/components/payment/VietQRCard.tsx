import React, { useState } from 'react';
import { Clipboard } from '@capacitor/clipboard';

interface VietQRCardProps {
  dealId: string;
  amount: number;
  bankAccount?: string;
  bankBin?: string;
  accountName?: string;
}

export const VietQRCard: React.FC<VietQRCardProps> = ({
  dealId,
  amount,
  bankAccount = '190366889988',
  bankBin = '970407', // Techcombank BIN
  accountName = 'TRUSTPASSZ ESCROW',
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const transferContent = `TPZ ${dealId.slice(0, 8).toUpperCase()}`;

  const qrUrl = `https://img.vietqr.io/image/${bankBin}-${bankAccount}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
    transferContent
  )}&accountName=${encodeURIComponent(accountName)}`;

  const copyToClipboard = async (text: string, type: string) => {
    await Clipboard.write({ string: text });
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 1800);
  };

  return (
    <div className="w-full bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-4 shadow-xl">
      <div className="text-center space-y-1">
        <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-xs">
          VietQR Ký Quỹ Động
        </span>
        <h4 className="text-sm font-semibold text-slate-200">
          Quét mã từ ứng dụng ngân hàng bất kỳ
        </h4>
      </div>

      <div className="flex justify-center p-3 bg-white rounded-2xl border-2 border-slate-700 shadow-inner">
        <img
          src={qrUrl}
          alt={`VietQR ${transferContent}`}
          className="w-56 h-auto object-contain rounded-lg"
          loading="lazy"
        />
      </div>

      <div className="space-y-2 pt-1 font-mono text-xs">
        <div className="flex items-center justify-between p-2.5 bg-[#080C14] border border-[#1E293B] rounded-xl">
          <div className="text-slate-400">
            <p className="text-[10px]">SỐ TÀI KHOẢN (TECHCOMBANK)</p>
            <p className="font-bold text-slate-100">{bankAccount}</p>
          </div>
          <button
            onClick={() => copyToClipboard(bankAccount, 'account')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg active:scale-95 transition text-[11px]"
          >
            {copiedType === 'account' ? '✓ Đã sao chép' : 'Sao chép'}
          </button>
        </div>

        <div className="flex items-center justify-between p-2.5 bg-[#080C14] border border-[#1E293B] rounded-xl">
          <div className="text-slate-400">
            <p className="text-[10px]">NỘI DUNG CHUYỂN KHOẢN (BẮT BUỘC)</p>
            <p className="font-bold text-amber-400">{transferContent}</p>
          </div>
          <button
            onClick={() => copyToClipboard(transferContent, 'content')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg active:scale-95 transition text-[11px]"
          >
            {copiedType === 'content' ? '✓ Đã sao chép' : 'Sao chép'}
          </button>
        </div>
      </div>
    </div>
  );
};

