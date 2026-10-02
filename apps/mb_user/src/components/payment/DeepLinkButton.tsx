import React, { useState } from 'react';
import { Browser } from '@capacitor/browser';
import { Clipboard } from '@capacitor/clipboard';

interface DeepLinkButtonProps {
  dealId: string;
  amount: number;
  bankAccount?: string;
}

export const DeepLinkButton: React.FC<DeepLinkButtonProps> = ({
  dealId,
  amount,
  bankAccount = '190366889988',
}) => {
  const [showFallback, setShowFallback] = useState(false);
  const [copied, setCopied] = useState(false);
  const transferContent = `TPZ ${dealId.slice(0, 8).toUpperCase()}`;

  const handleOpenBankApp = async () => {
    const deepLinkUrl = `vietqr://pay?amount=${amount}&message=${encodeURIComponent(
      transferContent
    )}&account=${bankAccount}`;

    try {
      // Thử mở qua Capacitor Browser hoặc gán trực tiếp window.location
      window.location.href = deepLinkUrl;

      setTimeout(async () => {
        try {
          await Browser.open({ url: deepLinkUrl, windowName: '_system' });
        } catch {
          setShowFallback(true);
        }
      }, 500);
    } catch (err) {
      console.warn('[DeepLinkButton] Could not open native bank scheme, showing fallback:', err);
      setShowFallback(true);
    }
  };

  const handleCopyAll = async () => {
    const text = `Ngân hàng: Techcombank\nSTK: ${bankAccount}\nSố tiền: ${amount.toLocaleString('vi-VN')} VND\nNội dung: ${transferContent}`;
    await Clipboard.write({ string: text });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full space-y-3">
      <button
        onClick={handleOpenBankApp}
        className="w-full h-14 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/25 active:scale-95 transition-transform flex items-center justify-center gap-2 text-sm"
      >
        <span>⚡</span> Mở App Ngân Hàng Thanh Toán
      </button>

      {showFallback && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 animate-in fade-in duration-300">
          <p className="text-[11px] text-amber-300">
            Không tìm thấy app VietQR hỗ trợ mở trực tiếp trên thiết bị này. Vui lòng quét mã QR hoặc sao chép thông tin:
          </p>
          <button
            onClick={handleCopyAll}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold text-xs rounded-lg active:scale-95 transition border border-slate-700"
          >
            {copied ? '✓ Đã sao chép toàn bộ thông tin' : '📋 Sao Chép STK & Cú Pháp'}
          </button>
        </div>
      )}
    </div>
  );
};
