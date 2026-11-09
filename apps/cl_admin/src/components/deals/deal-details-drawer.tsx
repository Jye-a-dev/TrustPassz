'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Deal } from '@/types';
import {
  FileCode,
  Clock,
  User,
  Copy,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';

interface DealDetailsDrawerProps {
  deal: Deal | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenOverride: (deal: Deal) => void;
}

export function DealDetailsDrawer({
  deal,
  isOpen,
  onClose,
  onOpenOverride,
}: DealDetailsDrawerProps) {
  const [copiedHash, setCopiedHash] = React.useState(false);

  if (!deal) return null;

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    toast.success('Đã sao chép SHA-256 Hash vào clipboard');
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const getBadgeVariant = (state: string) => {
    switch (state) {
      case 'SETTLED':
        return 'emerald';
      case 'DEPOSITED':
      case 'IN_INSPECTION':
        return 'cyan';
      case 'DISPUTED':
        return 'amber';
      case 'REFUNDED':
        return 'rose';
      default:
        return 'outline';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-slate-200 bg-white text-slate-900 sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl p-6">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={getBadgeVariant(deal.state) as any} className="font-mono text-xs">
                {deal.state}
              </Badge>
              <DialogTitle className="text-base font-bold text-slate-900">
                Chi Tiết Giao Dịch: #{deal.id.slice(0, 8)}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-xs text-slate-500 line-clamp-2 mt-1">
            {deal.title} {deal.description ? `— ${deal.description}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Amount and Basic Escrow Status */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Số Tiền Ký Quỹ Đã Khóa:</span>
              <span className="font-mono text-base font-bold text-slate-900 tabular-nums">
                {Number(deal.amount).toLocaleString('vi-VN')} {deal.currency}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs border-t border-slate-200/60 pt-2">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                Thời lượng nghiệm thu:
              </span>
              <span className="font-mono font-semibold text-slate-800">
                {Math.round(deal.inspectionDuration / 3600)} Giờ ({deal.inspectionDuration}s)
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Bắt đầu: {deal.depositedAt ? new Date(deal.depositedAt).toLocaleString('vi-VN') : 'Chưa kích hoạt'}</span>
              <span>Hạn chót: {deal.inspectionDeadline ? new Date(deal.inspectionDeadline).toLocaleString('vi-VN') : 'Theo timer'}</span>
            </div>
          </div>

          {/* Participants: Seller vs Buyer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1 text-xs">
              <div className="flex items-center space-x-1.5 text-slate-500">
                <User className="h-3.5 w-3.5 text-cyan-600" />
                <span className="font-medium text-[11px]">Bên Bán (Seller)</span>
              </div>
              <p className="font-bold text-slate-900">{deal.seller?.displayName || 'Trusted Seller'}</p>
              <p className="font-mono text-[10px] text-slate-400 break-all select-all">
                {deal.seller?.walletAddress || deal.sellerId}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1 text-xs">
              <div className="flex items-center space-x-1.5 text-slate-500">
                <User className="h-3.5 w-3.5 text-emerald-600" />
                <span className="font-medium text-[11px]">Bên Mua (Buyer)</span>
              </div>
              <p className="font-bold text-slate-900">{deal.buyer?.displayName || 'Verified Buyer'}</p>
              <p className="font-mono text-[10px] text-slate-400 break-all select-all">
                {deal.buyer?.walletAddress || deal.buyerId || 'Chưa gán Buyer'}
              </p>
            </div>
          </div>

          {/* Digital Vault Metadata */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-xs">
            <div className="flex items-center space-x-1.5 text-slate-700">
              <FileCode className="h-4 w-4 text-indigo-600" />
              <span className="font-bold text-slate-900">Tài Sản Số Mã Hóa (Digital Vault)</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-500">
              <div>
                <span className="text-[11px] block">Loại tài sản:</span>
                <p className="font-mono font-medium text-slate-800">{deal.digitalAsset?.assetType || 'SOURCE_CODE'}</p>
              </div>
              <div>
                <span className="text-[11px] block">Tên tệp:</span>
                <p className="font-mono font-medium text-slate-800 truncate">{deal.digitalAsset?.fileName || 'asset-vault.zip'}</p>
              </div>
              <div>
                <span className="text-[11px] block">Lượt mở khóa:</span>
                <p className="font-mono font-medium text-slate-800">
                  {deal.digitalAsset?.accessCount ?? 0} / {deal.digitalAsset?.maxAccessLimit ?? 1}
                </p>
              </div>
              <div>
                <span className="text-[11px] block">Kích thước:</span>
                <p className="font-mono font-medium text-slate-800">
                  {deal.digitalAsset?.fileSizeBytes
                    ? `${(Number(deal.digitalAsset.fileSizeBytes) / 1024 / 1024).toFixed(2)} MB`
                    : '12.4 MB'}
                </p>
              </div>
            </div>

            {/* SHA-256 Hash */}
            <div className="pt-2 border-t border-slate-200/60">
              <div className="text-[11px] text-slate-500 flex items-center justify-between mb-1">
                <span className="font-medium">SHA-256 Content Vault Integrity:</span>
                <button
                  type="button"
                  onClick={() =>
                    copyHash(
                      deal.digitalAsset?.contentHash ||
                        'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e'
                    )
                  }
                  className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 text-[11px] font-medium"
                >
                  {copiedHash ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  Sao chép
                </button>
              </div>
              <p className="font-mono text-[11px] text-slate-600 break-all bg-white p-2 rounded-lg border border-slate-200">
                {deal.digitalAsset?.contentHash ||
                  'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-10 px-4 rounded-lg border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs"
          >
            Đóng
          </Button>
          <Button
            type="button"
            onClick={() => {
              onClose();
              onOpenOverride(deal);
            }}
            className="h-10 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center gap-1.5"
          >
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            Can Thiệp Override
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
