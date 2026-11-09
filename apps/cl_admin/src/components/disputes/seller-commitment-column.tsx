'use client';

import * as React from 'react';
import { ShieldCheck, FileCode, Copy, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Deal } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SellerCommitmentColumnProps {
  deal: Deal;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  isPiiUnlocked: boolean;
  redactedDescription: string;
  className?: string;
}

export function SellerCommitmentColumn({
  deal,
  scrollRef,
  onScroll,
  isPiiUnlocked,
  redactedDescription,
  className,
}: SellerCommitmentColumnProps) {
  const [copiedHash, setCopiedHash] = React.useState(false);

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    toast.success('Đã sao chép SHA-256 Hash');
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const sellerDesc = deal.description || 'Toàn bộ Source Code và database seed cam kết không lỗi runtime.';

  return (
    <Card className={cn('rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3 flex flex-col h-105', className)}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
          <ShieldCheck className="size-4.5 text-slate-700" />
          Cam Kết Bàn Giao Của Seller
        </span>
        <span className="rounded bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-mono border border-slate-200">
          Digital Vault
        </span>
      </div>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="space-y-3 flex-1 overflow-y-auto scrollbar-thin text-xs"
      >
        {/* Title & Description */}
        <div className="space-y-1">
          <span className="font-semibold text-slate-700 text-xs">Tên gói tài sản số:</span>
          <p className="font-semibold text-slate-900 text-xs">{deal.title}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1">
          <span className="text-slate-700 font-semibold block text-[11px]">Thông số kỹ thuật cam kết:</span>
          <div className="text-slate-600 leading-relaxed font-sans text-xs">
            {isPiiUnlocked ? sellerDesc : redactedDescription}
          </div>
        </div>

        {/* Content Hash SHA-256 */}
        <div className="space-y-2 text-xs">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <FileCode className="h-4 w-4 text-slate-500" />
            Dấu vân tay tài sản số (Digital Vault Hash):
          </span>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>Loại: <strong className="text-slate-900 font-semibold">{deal.digitalAsset?.assetType || 'SOURCE_CODE'}</strong></span>
              <span>File: <strong className="text-slate-900 font-semibold">{deal.digitalAsset?.fileName || 'escrow-release.zip'}</strong></span>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                <span>SHA-256 On-Chain Commitment:</span>
                <button
                  type="button"
                  onClick={() =>
                    copyHash(
                      deal.digitalAsset?.contentHash ||
                        'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e'
                    )
                  }
                  className="text-slate-700 hover:text-slate-900 flex items-center gap-1 min-h-[32px] px-2 font-mono font-medium"
                >
                  {copiedHash ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  Copy Hash
                </button>
              </div>
              <p className="text-[11px] font-mono text-slate-800 break-all bg-white p-2 rounded border border-slate-200">
                {deal.digitalAsset?.contentHash ||
                  'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

