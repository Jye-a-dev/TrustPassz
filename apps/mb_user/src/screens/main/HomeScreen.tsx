import React, { useEffect, useState } from 'react';
import { useDealStore } from '../../stores/useDealStore';
import { DealCard } from '../../components/deal/DealCard';
import type { Deal } from '../../types';

interface HomeScreenProps {
  onSelectDeal: (deal: Deal) => void;
  onOpenDisputeFlow: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectDeal,
  onOpenDisputeFlow,
}) => {
  const { deals, isLoading, loadDeals } = useDealStore();
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'DEPOSITED' | 'IN_INSPECTION'>('ALL');

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  const filteredDeals = deals.filter((d) => {
    if (filter === 'ALL') return true;
    return d.state === filter;
  });

  return (
    <div className="flex flex-col h-full bg-[#080C14] text-slate-100 p-4 space-y-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Sàn Kèo Ký Quỹ</h2>
          <p className="text-xs text-slate-400 font-mono">Realtime Escrow Marketplace</p>
        </div>

        <button
          onClick={() => loadDeals()}
          disabled={isLoading}
          className="px-3 py-1.5 bg-[#0F172A] border border-[#1E293B] rounded-xl text-xs font-mono text-cyan-400 hover:text-cyan-300 active:scale-95 transition"
        >
          {isLoading ? 'Đang tải...' : '↻ Làm mới'}
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-mono">
        {[
          { key: 'ALL', label: 'Tất cả' },
          { key: 'PENDING', label: 'Chờ Ký Quỹ' },
          { key: 'DEPOSITED', label: 'Đã Khóa Tiền' },
          { key: 'IN_INSPECTION', label: 'Đồng Kiểm' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as typeof filter)}
            className={`px-3 py-1.5 rounded-xl border whitespace-nowrap active:scale-95 transition ${
              filter === tab.key
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-semibold'
                : 'bg-[#0F172A] border-[#1E293B] text-slate-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && deals.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Đang tải danh sách kèo trực tiếp...</p>
        </div>
      ) : filteredDeals.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[#0F172A]/50 border border-dashed border-[#1E293B] rounded-3xl text-center space-y-3">
          <span className="text-3xl">📭</span>
          <p className="text-sm font-semibold text-slate-300">Không có kèo phù hợp</p>
          <p className="text-xs text-slate-400 max-w-xs">
            Hiện chưa có giao dịch nào ở trạng thái này hoặc đang chờ cập nhật từ backend.
          </p>
        </div>
      ) : (
        <div className="space-y-3 pb-8">
          {filteredDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onSelect={onSelectDeal} />
          ))}
        </div>
      )}

      <div className="pt-2 pb-6">
        <button
          onClick={onOpenDisputeFlow}
          className="w-full h-12 bg-[#0F172A] hover:bg-slate-800 border border-rose-500/40 text-rose-400 font-bold rounded-2xl active:scale-95 transition flex items-center justify-center gap-2 text-xs"
        >
          <span>⚖️</span> Khiếu Nại Trọng Tài AI (Dispute Center)
        </button>
      </div>
    </div>
  );
};

