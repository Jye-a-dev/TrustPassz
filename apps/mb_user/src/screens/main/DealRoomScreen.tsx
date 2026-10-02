import React, { useState, useEffect, useCallback } from 'react';
import type { Deal, UnlockedVaultPayload } from '../../types';
import { useDealStore } from '../../stores/useDealStore';
import { BargainSlider } from '../../components/deal/BargainSlider';
import { VietQRCard } from '../../components/payment/VietQRCard';
import { DeepLinkButton } from '../../components/payment/DeepLinkButton';
import { VaultModal } from '../../components/deal/VaultModal';
import { fetchDealById, unlockDealVault, settleEscrowDeal } from '../../services/deal.service';

interface DealRoomScreenProps {
  dealId: string;
  onBack: () => void;
  onOpenDispute: (dealId: string) => void;
}

export const DealRoomScreen: React.FC<DealRoomScreenProps> = ({
  dealId,
  onBack,
  onOpenDispute,
}) => {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [vaultData, setVaultData] = useState<UnlockedVaultPayload | null>(null);
  const [showVault, setShowVault] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const { proposeNewPrice } = useDealStore();

  const playChimeSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.65);
    } catch (e) {
      console.warn('[WebAudio] Chime playback not permitted or unsupported:', e);
    }
  };

  const loadVaultPayload = useCallback(async (currentDealId: string) => {
    try {
      const data = await unlockDealVault(currentDealId);
      setVaultData(data);
      setShowVault(true);
      playChimeSound();
    } catch (err) {
      console.warn('[DealRoom] Could not automatically unlock vault:', err);
    }
  }, []);

  const refreshDeal = useCallback(async () => {
    try {
      const updated = await fetchDealById(dealId);
      setDeal((prev) => {
        if (
          prev &&
          prev.state === 'PENDING' &&
          (updated.state === 'DEPOSITED' || updated.state === 'IN_INSPECTION')
        ) {
          loadVaultPayload(updated.id);
        }
        return updated;
      });
    } catch (e) {
      console.error('[DealRoom] Error refreshing deal:', e);
    }
  }, [dealId, loadVaultPayload]);

  useEffect(() => {
    refreshDeal();
    if (!isPolling) return;
    const interval = setInterval(refreshDeal, 2500);
    return () => clearInterval(interval);
  }, [dealId, isPolling, refreshDeal]);

  const handlePriceBargain = async (newPrice: number) => {
    if (!deal) return;
    try {
      await proposeNewPrice(deal.id, newPrice);
      setDeal({ ...deal, amount: newPrice });
      setFeedbackMsg('✓ Đã cập nhật giá đàm phán thành công');
      setTimeout(() => setFeedbackMsg(null), 2500);
    } catch (err) {
      setFeedbackMsg(`❌ Lỗi đàm phán: ${(err as Error).message}`);
    }
  };

  const handleSettleDeal = async () => {
    if (!deal) return;
    try {
      await settleEscrowDeal(deal.id);
      setShowVault(false);
      setIsPolling(false);
      refreshDeal();
      setFeedbackMsg('✓ Đã giải ngân escrow thành công!');
    } catch (err) {
      alert(`Lỗi giải ngân: ${(err as Error).message}`);
    }
  };

  if (!deal) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#080C14] text-slate-400 font-mono text-xs">
        Đang đồng bộ bàn đàm phán...
      </div>
    );
  }

  const numericAmount = typeof deal.amount === 'string' ? parseFloat(deal.amount) : deal.amount;
  const isPendingDeposit = deal.state === 'PENDING';
  const hasDeposited = deal.state === 'DEPOSITED' || deal.state === 'IN_INSPECTION';

  return (
    <div className="flex flex-col h-full bg-[#080C14] text-slate-100 p-4 space-y-4 overflow-y-auto pb-12">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-3 py-1.5 bg-[#0F172A] border border-[#1E293B] rounded-xl text-xs text-slate-300 active:scale-95 transition"
        >
          ← Quay lại
        </button>
        <span className="font-mono text-xs text-cyan-400">DEAL ROOM: {deal.id.slice(0, 8)}</span>
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400 text-xs text-center font-mono">
          {feedbackMsg}
        </div>
      )}

      <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-3 shadow-xl">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold text-white">{deal.title}</h2>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 uppercase">
            {deal.state}
          </span>
        </div>

        {deal.description && <p className="text-xs text-slate-400">{deal.description}</p>}

        <div className="pt-2 flex justify-between items-center text-xs font-mono text-slate-400 border-t border-[#1E293B]">
          <span>Thời hạn đồng kiểm:</span>
          <span className="text-slate-200 font-bold">
            {Math.round(deal.inspectionDuration / 3600)} Giờ
          </span>
        </div>
      </div>

      {isPendingDeposit && (
        <>
          <div className="space-y-2">
            <h3 className="text-xs font-mono text-slate-400 uppercase">Bàn Đàm Phán Trả Giá</h3>
            <BargainSlider
              minPrice={Math.max(50000, Math.round(numericAmount * 0.5))}
              maxPrice={Math.round(numericAmount * 1.5)}
              currentPrice={numericAmount}
              onPriceChange={handlePriceBargain}
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-mono text-slate-400 uppercase">Thanh Toán Ký Quỹ</h3>
            <DeepLinkButton dealId={deal.id} amount={numericAmount} />
            <VietQRCard dealId={deal.id} amount={numericAmount} />
          </div>
        </>
      )}

      {hasDeposited && (
        <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔐</span>
            <div>
              <h3 className="text-sm font-bold text-emerald-400">Tiền Ký Quỹ Đã Được Khóa</h3>
              <p className="text-[11px] text-slate-300">
                Digital Vault đã mở. Bạn có thể kiểm tra sản phẩm và xác nhận giải ngân.
              </p>
            </div>
          </div>

          <button
            onClick={() => loadVaultPayload(deal.id)}
            className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl active:scale-95 transition text-xs font-mono"
          >
            Mở Két Số Digital Vault
          </button>
        </div>
      )}

      {showVault && vaultData && (
        <VaultModal
          deal={deal}
          vaultData={vaultData}
          onClose={() => setShowVault(false)}
          onSettle={handleSettleDeal}
          onDispute={() => {
            setShowVault(false);
            onOpenDispute(deal.id);
          }}
        />
      )}
    </div>
  );
};

