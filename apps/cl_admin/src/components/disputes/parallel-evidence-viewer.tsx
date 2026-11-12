'use client';

import * as React from 'react';
import { EyeOff, Link2, Unlink, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EvidenceZoomCanvas } from './evidence-zoom-canvas';
import { SellerCommitmentColumn } from './seller-commitment-column';
import { BuyerEvidenceColumn } from './buyer-evidence-column';
import { PiiUnlockDialog } from './pii-unlock-dialog';
import { redactSensitiveData, detectPiiCategories } from '@/lib/pii-masker';
import { logAdminAction } from '@/lib/audit-logger';
import { cn } from '@/lib/utils';
import type { Deal, DisputeLog } from '@/types';
import { toast } from 'sonner';

interface ParallelEvidenceViewerProps {
  deal: Deal;
  dispute: DisputeLog;
  className?: string;
}

export function ParallelEvidenceViewer({
  deal,
  dispute,
  className,
}: ParallelEvidenceViewerProps) {
  const [isSyncScroll, setIsSyncScroll] = React.useState(false);
  const [activeMobileTab, setActiveMobileTab] = React.useState<'seller' | 'buyer'>('seller');
  const [isPiiUnlocked, setIsPiiUnlocked] = React.useState(false);
  const [unlockConfirmOpen, setUnlockConfirmOpen] = React.useState(false);
  const [zoomTarget, setZoomTarget] = React.useState<{ src: string; title: string } | null>(null);

  const leftPaneRef = React.useRef<HTMLDivElement>(null);
  const rightPaneRef = React.useRef<HTMLDivElement>(null);
  const isScrollingRef = React.useRef(false);

  // Synchronized scrolling handlers
  const handleScroll = (source: 'left' | 'right') => {
    if (!isSyncScroll || isScrollingRef.current) return;
    isScrollingRef.current = true;

    const srcElem = source === 'left' ? leftPaneRef.current : rightPaneRef.current;
    const dstElem = source === 'left' ? rightPaneRef.current : leftPaneRef.current;

    if (srcElem && dstElem) {
      const scrollRatio = srcElem.scrollTop / (srcElem.scrollHeight - srcElem.clientHeight || 1);
      dstElem.scrollTop = scrollRatio * (dstElem.scrollHeight - dstElem.clientHeight);
    }

    requestAnimationFrame(() => {
      isScrollingRef.current = false;
    });
  };

  // PII analysis on texts
  const sellerDesc = deal.description || 'Toàn bộ Source Code và database seed cam kết không lỗi runtime.';
  const buyerLogs = `[14:22:01] Starting Escrow Service runner...\n[14:22:02] Loaded configuration with JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.fake_token_for_audit\n[14:22:03] Attempting key derivation: 0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d\n[FATAL] TypeError: Cannot read properties of undefined (reading 'privateKey')\n    at EscrowService.init (dist/escrow.service.js:42:18)\n[FATAL] Server crashed during startup with exit code 1.`;

  const sellerPiiRedacted = redactSensitiveData(sellerDesc);
  const buyerPiiRedacted = redactSensitiveData(buyerLogs);
  const allDetectedCategories = Array.from(
    new Set([
      ...detectPiiCategories(sellerDesc),
      ...detectPiiCategories(buyerLogs),
    ])
  );

  const handleConfirmUnlockPii = async () => {
    setIsPiiUnlocked(true);
    setUnlockConfirmOpen(false);
    await logAdminAction('VIEW_SENSITIVE_PII', 'dispute_logs', dispute.id, {
      dealId: deal.id,
      categories: allDetectedCategories,
    });
    toast.warning('Đã mở khóa dữ liệu PII. Hành động này đã được ghi log kiểm toán.');
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Control Header: Sync scroll & PII Masking Switch */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-xs">
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsSyncScroll(!isSyncScroll)}
            className={cn(
              'min-h-[40px] text-xs font-mono gap-1.5 transition-all shadow-2xs',
              isSyncScroll
                ? 'border-slate-300 bg-slate-100 text-slate-900 font-semibold'
                : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            )}
          >
            {isSyncScroll ? <Link2 className="h-4 w-4 text-slate-900" /> : <Unlink className="h-4 w-4 text-slate-400" />}
            <span>{isSyncScroll ? 'Đồng bộ cuộn: BẬT' : 'Đồng bộ cuộn: TẮT'}</span>
          </Button>

          {allDetectedCategories.length > 0 && (
            <Badge variant="amber" className="text-[10px] font-mono py-1">
              Phát hiện {allDetectedCategories.length} trường PII nhạy cảm
            </Badge>
          )}
        </div>

        {/* PII Unlock Toggle */}
        <div className="flex items-center space-x-2">
          {isPiiUnlocked ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPiiUnlocked(false)}
              className="min-h-[40px] border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-mono gap-1.5"
            >
              <EyeOff className="h-4 w-4 text-amber-600" />
              <span>Khóa lại PII (Che thông tin)</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setUnlockConfirmOpen(true)}
              className="min-h-[40px] border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-mono gap-1.5 shadow-2xs"
            >
              <Lock className="h-4 w-4 text-slate-600" />
              <span>Mở khóa xem PII (Ghi log Audit)</span>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="flex lg:hidden rounded-lg border border-slate-200 bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setActiveMobileTab('seller')}
          className={cn(
            'flex-1 min-h-[40px] rounded-md text-xs font-medium transition-all',
            activeMobileTab === 'seller'
              ? 'bg-white text-slate-900 shadow-2xs font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          )}
        >
          Cam Kết Seller
        </button>
        <button
          type="button"
          onClick={() => setActiveMobileTab('buyer')}
          className={cn(
            'flex-1 min-h-[40px] rounded-md text-xs font-medium transition-all',
            activeMobileTab === 'buyer'
              ? 'bg-white text-slate-900 shadow-2xs font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          )}
        >
          Bằng Chứng Buyer
        </button>
      </div>

      {/* 2-Column Side-by-Side Dual Pane */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SellerCommitmentColumn
          deal={deal}
          scrollRef={leftPaneRef}
          onScroll={() => handleScroll('left')}
          isPiiUnlocked={isPiiUnlocked}
          redactedDescription={sellerPiiRedacted.sanitizedText}
          className={activeMobileTab !== 'seller' ? 'hidden lg:flex' : undefined}
        />

        <BuyerEvidenceColumn
          dispute={dispute}
          scrollRef={rightPaneRef}
          onScroll={() => handleScroll('right')}
          isPiiUnlocked={isPiiUnlocked}
          rawLogs={buyerLogs}
          redactedLogs={buyerPiiRedacted.sanitizedText}
          onSelectImage={setZoomTarget}
          className={activeMobileTab !== 'buyer' ? 'hidden lg:flex' : undefined}
        />
      </div>

      {/* PII Unlock Confirmation Dialog */}
      <PiiUnlockDialog
        isOpen={unlockConfirmOpen}
        onClose={() => setUnlockConfirmOpen(false)}
        onConfirm={handleConfirmUnlockPii}
        detectedCategories={allDetectedCategories}
      />

      {/* Zoom Canvas Modal */}
      {zoomTarget && (
        <EvidenceZoomCanvas
          src={zoomTarget.src}
          title={zoomTarget.title}
          isOpen={Boolean(zoomTarget)}
          onClose={() => setZoomTarget(null)}
        />
      )}
    </div>
  );
}
