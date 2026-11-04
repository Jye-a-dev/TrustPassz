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
    <Card className={cn('border-slate-800 bg-[#0F172A] shadow-lg flex flex-col', className)}>
      <CardHeader className="border-b border-slate-800 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-semibold text-white">
              Cột Trái: Tài Sản Gốc &amp; Cam Kết của Seller
            </CardTitle>
          </div>
          <Badge variant="outline" className="border-cyan-800 bg-cyan-950/40 text-cyan-400 text-[10px] font-mono">
            Verified Seller
          </Badge>
        </div>
      </CardHeader>

      <CardContent
        ref={scrollRef}
        onScroll={onScroll}
        className="space-y-4 pt-4 flex-1 max-h-[580px] overflow-y-auto"
      >
        {/* Title & Description */}
        <div className="space-y-1 text-xs">
          <span className="font-semibold text-slate-300">Tên gói tài sản số:</span>
          <p className="font-semibold text-white text-sm">{deal.title}</p>
        </div>

        <div className="space-y-1 text-xs">
          <span className="font-semibold text-slate-300">Mô tả cam kết kỹ thuật ban đầu:</span>
          <div className="rounded-lg border border-slate-800 bg-[#080C14] p-3 text-slate-300 leading-relaxed font-sans text-xs">
            {isPiiUnlocked ? sellerDesc : redactedDescription}
          </div>
        </div>

        {/* Content Hash SHA-256 */}
        <div className="space-y-2 text-xs">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <FileCode className="h-4 w-4 text-cyan-400" />
            Dấu vân tay tài sản số (Digital Vault Hash):
          </span>
          <div className="rounded-lg border border-slate-800 bg-[#080C14] p-3 space-y-2">
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Loại: <strong className="text-white">{deal.digitalAsset?.assetType || 'SOURCE_CODE'}</strong></span>
              <span>File: <strong className="text-white">{deal.digitalAsset?.fileName || 'escrow-release.zip'}</strong></span>
            </div>
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span>SHA-256 On-Chain Commitment:</span>
                <button
                  type="button"
                  onClick={() =>
                    copyHash(
                      deal.digitalAsset?.contentHash ||
                        'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e'
                    )
                  }
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 min-h-[32px] px-2"
                >
                  {copiedHash ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  Copy Hash
                </button>
              </div>
              <p className="font-mono text-[10px] text-cyan-300 break-all bg-slate-900/90 p-2 rounded border border-slate-800">
                {deal.digitalAsset?.contentHash ||
                  'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e'}
              </p>
            </div>
          </div>
        </div>

        {/* Seller Identity info */}
        <div className="rounded-lg border border-slate-800 bg-[#080C14] p-3 text-xs text-slate-400 space-y-1">
          <p>Người bán: <strong className="text-white">{deal.seller?.displayName || 'DevMaster Pro'}</strong></p>
          <p className="font-mono text-[11px]">Ví: {deal.seller?.walletAddress || '0x1111...1111'}</p>
        </div>
      </CardContent>
    </Card>
  );
}

