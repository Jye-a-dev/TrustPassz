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

  const getBadgeColor = (state: string) => {
    switch (state) {
      case 'SETTLED':
        return 'border-emerald-800 text-emerald-400 bg-emerald-950/40';
      case 'DEPOSITED':
      case 'IN_INSPECTION':
        return 'border-cyan-800 text-cyan-400 bg-cyan-950/40';
      case 'DISPUTED':
        return 'border-amber-800 text-amber-400 bg-amber-950/40';
      case 'REFUNDED':
        return 'border-rose-800 text-rose-400 bg-rose-950/40';
      default:
        return 'border-slate-700 text-slate-300 bg-slate-900';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-slate-800 bg-[#0F172A] text-slate-100 sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold text-white">
              Chi Tiết Kèo & Digital Vault
            </DialogTitle>
            <Badge variant="outline" className={`font-mono text-xs ${getBadgeColor(deal.state)}`}>
              {deal.state}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-slate-400 font-mono">
            UUID: {deal.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Header Title & Amount */}
          <div className="rounded-lg border border-slate-800 bg-[#080C14] p-3.5 space-y-2">
            <h4 className="text-sm font-semibold text-white">{deal.title}</h4>
            {deal.description && (
              <p className="text-xs text-slate-400">{deal.description}</p>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400">Giá trị ký quỹ:</span>
              <span className="font-mono text-base font-bold text-cyan-400">
                {Number(deal.amount).toLocaleString('vi-VN')} {deal.currency}
              </span>
            </div>
          </div>

          {/* Participants */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-800 bg-[#080C14] p-3 space-y-1 text-xs">
              <div className="flex items-center space-x-1.5 text-slate-400">
                <User className="h-3.5 w-3.5 text-cyan-400" />
                <span className="font-semibold text-slate-300">Người Bán (Seller)</span>
              </div>
              <p className="font-medium text-white">{deal.seller?.displayName || 'Trusted Seller'}</p>
              <p className="font-mono text-[11px] text-slate-500 truncate">
                {deal.seller?.walletAddress || deal.sellerId}
              </p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-[#080C14] p-3 space-y-1 text-xs">
              <div className="flex items-center space-x-1.5 text-slate-400">
                <User className="h-3.5 w-3.5 text-emerald-400" />
                <span className="font-semibold text-slate-300">Người Mua (Buyer)</span>
              </div>
              <p className="font-medium text-white">{deal.buyer?.displayName || 'Verified Buyer'}</p>
              <p className="font-mono text-[11px] text-slate-500 truncate">
                {deal.buyer?.walletAddress || deal.buyerId || 'Chưa gán Buyer'}
              </p>
            </div>
          </div>

          {/* Inspection Window */}
          <div className="rounded-lg border border-slate-800 bg-[#080C14] p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                Thời lượng nghiệm thu (Inspection Timer):
              </span>
              <span className="font-mono font-semibold text-white">
                {Math.round(deal.inspectionDuration / 3600)} Giờ ({deal.inspectionDuration}s)
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Bắt đầu: {deal.depositedAt ? new Date(deal.depositedAt).toLocaleString('vi-VN') : 'Chưa kích hoạt'}</span>
              <span>Hạn chót: {deal.inspectionDeadline ? new Date(deal.inspectionDeadline).toLocaleString('vi-VN') : 'Theo timer'}</span>
            </div>
          </div>

          {/* Digital Vault Metadata */}
          <div className="rounded-lg border border-slate-800 bg-[#080C14] p-3.5 space-y-2 text-xs">
            <div className="flex items-center space-x-1.5 text-slate-300">
              <FileCode className="h-4 w-4 text-cyan-400" />
              <span className="font-semibold text-white">Tài Sản Số Mã Hóa (Digital Vault)</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-400 pt-1">
              <div>
                <span>Loại tài sản:</span>
                <p className="font-mono text-white">{deal.digitalAsset?.assetType || 'SOURCE_CODE'}</p>
              </div>
              <div>
                <span>Tên tệp:</span>
                <p className="font-mono text-white truncate">{deal.digitalAsset?.fileName || 'asset-vault.zip'}</p>
              </div>
              <div>
                <span>Giới hạn mở khóa:</span>
                <p className="font-mono text-white">
                  {deal.digitalAsset?.accessCount ?? 0} / {deal.digitalAsset?.maxAccessLimit ?? 1} lượt
                </p>
              </div>
              <div>
                <span>Kích thước:</span>
                <p className="font-mono text-white">
                  {deal.digitalAsset?.fileSizeBytes
                    ? `${(Number(deal.digitalAsset.fileSizeBytes) / 1024 / 1024).toFixed(2)} MB`
                    : '12.4 MB'}
                </p>
              </div>
            </div>

            {/* SHA-256 Hash */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Content Hash (SHA-256 Integrity):</span>
                <button
                  onClick={() =>
                    copyHash(
                      deal.digitalAsset?.contentHash ||
                        'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e'
                    )
                  }
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[10px]"
                >
                  {copiedHash ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  Sao chép
                </button>
              </span>
              <p className="font-mono text-[11px] text-slate-300 break-all bg-slate-900/80 p-1.5 rounded mt-1 border border-slate-800">
                {deal.digitalAsset?.contentHash ||
                  'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-800 pt-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs text-slate-400">
            Đóng
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onClose();
              onOpenOverride(deal);
            }}
            className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-xs h-8"
          >
            Mở Công Cụ Admin Override &rarr;
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
