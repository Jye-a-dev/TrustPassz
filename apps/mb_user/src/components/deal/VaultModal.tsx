import React, { useState } from 'react';
import { Clipboard } from '@capacitor/clipboard';
import type { Deal, UnlockedVaultPayload } from '../../types';
import { CountdownTimer } from '../common/CountdownTimer';

interface VaultModalProps {
  deal: Deal;
  vaultData: UnlockedVaultPayload;
  onClose: () => void;
  onSettle: () => void;
  onDispute: () => void;
}

export const VaultModal: React.FC<VaultModalProps> = ({
  deal,
  vaultData,
  onClose,
  onSettle,
  onDispute,
}) => {
  const [copied, setCopied] = useState(false);

  const displaySecret =
    vaultData.decryptedKeyOrUrl ||
    vaultData.encryptedPayload ||
    'KEY-TPZ-8899-SECURE-ESCROW-UNLOCKED';

  const handleCopy = async () => {
    await Clipboard.write({ string: displaySecret });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-[#0F172A] border-t sm:border border-emerald-500/40 rounded-t-3xl sm:rounded-2xl p-6 space-y-4 shadow-2xl shadow-emerald-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-lg">
              🔓
            </span>
            <div>
              <h3 className="text-base font-bold text-white">Digital Vault Mở Két</h3>
              <p className="text-[11px] text-emerald-400 font-mono">AES-256-GCM Verified</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center active:scale-95"
          >
            ✕
          </button>
        </div>

        <div className="flex justify-between items-center">
          <CountdownTimer targetTimestamp={deal.inspectionEndsAt} />
          <span className="text-[11px] font-mono text-slate-400">
            Lượt mở: {vaultData.accessCount}/{vaultData.maxAccessLimit}
          </span>
        </div>

        <div className="p-4 bg-[#080C14] border border-[#1E293B] rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono">Tài sản số ({vaultData.fileName || 'Asset'}):</span>
            <span className="text-cyan-400 text-[10px] font-mono">Chỉ xem 1 lần</span>
          </div>

          <div className="p-3 bg-[#0B0F17] rounded-lg font-mono text-cyan-300 text-xs break-all border border-slate-800 select-all">
            {displaySecret}
          </div>

          <button
            onClick={handleCopy}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs text-cyan-400 font-semibold rounded-lg border border-slate-700 transition"
          >
            {copied ? '✓ Đã sao chép License / Link tải' : '📋 Sao chép vào bộ nhớ tạm'}
          </button>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={onSettle}
            className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl active:scale-95 transition shadow-lg shadow-emerald-500/20 text-sm"
          >
            Xác Nhận Nghiệm Thu & Giải Ngân
          </button>

          <button
            onClick={onDispute}
            className="w-full h-11 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold rounded-xl active:scale-95 border border-rose-500/30 transition text-xs"
          >
            Sản Phẩm Lỗi? Mở Tranh Chấp AI
          </button>
        </div>
      </div>
    </div>
  );
};

