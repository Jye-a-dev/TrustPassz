import React from 'react';
import type { Deal, DealState } from '../../types';

interface DealCardProps {
  deal: Deal;
  onSelect: (deal: Deal) => void;
}

const STATE_CONFIG: Record<DealState, { label: string; bg: string; text: string; border: string }> = {
  PENDING: {
    label: 'Chờ Ký Quỹ',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
  },
  DEPOSITED: {
    label: 'Đã Ký Quỹ (Escrowed)',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  IN_INSPECTION: {
    label: 'Đang Đồng Kiểm',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/20',
  },
  SETTLED: {
    label: 'Đã Giải Ngân',
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/20',
  },
  REFUNDED: {
    label: 'Đã Hoàn Tiền',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/20',
  },
  DISPUTED: {
    label: 'Đang Tranh Chấp (AI)',
    bg: 'bg-rose-500/15',
    text: 'text-rose-400',
    border: 'border-rose-500/40',
  },
};

export const DealCard: React.FC<DealCardProps> = ({ deal, onSelect }) => {
  const stateMeta = STATE_CONFIG[deal.state] || {
    label: deal.state,
    bg: 'bg-slate-800',
    text: 'text-slate-300',
    border: 'border-slate-700',
  };

  const amountNumber = typeof deal.amount === 'string' ? parseFloat(deal.amount) : deal.amount;

  return (
    <div
      onClick={() => onSelect(deal)}
      className="w-full bg-[#0F172A] border border-[#1E293B] hover:border-cyan-500/40 rounded-2xl p-4 transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-lg shadow-black/40 space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-100 text-sm line-clamp-1 flex-1">
          {deal.title}
        </h3>
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium border ${stateMeta.bg} ${stateMeta.text} ${stateMeta.border}`}
        >
          {stateMeta.label}
        </span>
      </div>

      {deal.description && (
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {deal.description}
        </p>
      )}

      <div className="pt-2 border-t border-[#1E293B]/80 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-slate-400 font-mono">GIÁ KÝ QUỸ</p>
          <p className="text-base font-bold font-mono text-cyan-400">
            {amountNumber.toLocaleString('vi-VN')} {deal.currency}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] text-slate-400 font-mono">ĐỒNG KIỂM</p>
          <p className="text-xs font-semibold text-slate-200">
            {Math.round(deal.inspectionDuration / 3600)} giờ
          </p>
        </div>
      </div>
    </div>
  );
};

