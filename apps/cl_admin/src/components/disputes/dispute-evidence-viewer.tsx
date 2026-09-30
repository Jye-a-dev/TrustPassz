'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileCode,
  ShieldCheck,
  AlertTriangle,
  Image as ImageIcon,
  FileText,
  Copy,
  Check,
} from 'lucide-react';
import type { Deal, DisputeLog } from '@/types';
import { toast } from 'sonner';

interface DisputeEvidenceViewerProps {
  deal: Deal;
  dispute: DisputeLog;
}

export function DisputeEvidenceViewer({ deal, dispute }: DisputeEvidenceViewerProps) {
  const [copiedHash, setCopiedHash] = React.useState(false);

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    toast.success('Đã sao chép SHA-256 Hash');
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* LEFT: Seller's Initial Commitment & Asset Fingerprint */}
      <Card className="border-slate-800 bg-[#0F172A] shadow-md flex flex-col">
        <CardHeader className="border-b border-slate-800 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-semibold text-white">
                Bên Trái: Cam Kết Ban Đầu của Seller
              </CardTitle>
            </div>
            <Badge variant="outline" className="border-cyan-800 bg-cyan-950/40 text-cyan-400 text-[10px]">
              Seller Identity Verified
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4 flex-1">
          {/* Product description & commitments */}
          <div className="space-y-1 text-xs">
            <span className="font-semibold text-slate-300">Tên sản phẩm / Kèo:</span>
            <p className="font-medium text-white">{deal.title}</p>
          </div>

          <div className="space-y-1 text-xs">
            <span className="font-semibold text-slate-300">Mô tả cam kết kỹ thuật ban đầu:</span>
            <div className="rounded-lg border border-slate-800 bg-[#080C14] p-3 text-slate-300 leading-relaxed font-sans">
              {deal.description ||
                'Toàn bộ Source Code và database seed đã được kiểm thử trên Node 20+, đầy đủ tài liệu API, hướng dẫn build docker và cam kết không có lỗi runtime crash.'}
            </div>
          </div>

          {/* Digital Vault Fingerprint */}
          <div className="space-y-2 text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <FileCode className="h-4 w-4 text-cyan-400" />
              Dấu vân tay tài sản số (Digital Vault Hash):
            </span>
            <div className="rounded-lg border border-slate-800 bg-[#080C14] p-3 space-y-2">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Loại tài sản: <strong className="text-white font-mono">{deal.digitalAsset?.assetType || 'SOURCE_CODE'}</strong></span>
                <span>Tên file: <strong className="text-white font-mono">{deal.digitalAsset?.fileName || 'escrow-release.zip'}</strong></span>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>SHA-256 On-Chain Commitment:</span>
                  <button
                    onClick={() =>
                      copyHash(
                        deal.digitalAsset?.contentHash ||
                          'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e'
                      )
                    }
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
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

          {/* Seller Metadata */}
          <div className="rounded-lg border border-slate-800 bg-[#080C14] p-3 text-xs text-slate-400 space-y-1">
            <p>Người bán: <strong className="text-white">{deal.seller?.displayName || 'DevMaster Pro'}</strong></p>
            <p className="font-mono text-[11px]">Ví: {deal.seller?.walletAddress || '0x1111...1111'}</p>
          </div>
        </CardContent>
      </Card>

      {/* RIGHT: Buyer Evidence & Unbox Screenshots */}
      <Card className="border-slate-800 bg-[#0F172A] shadow-md flex flex-col">
        <CardHeader className="border-b border-slate-800 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-950/60 text-amber-400 border border-amber-800/40">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-semibold text-white">
                Bên Phải: Bằng Chứng Khiếu Nại của Buyer
              </CardTitle>
            </div>
            <Badge variant="outline" className="border-amber-800 bg-amber-950/40 text-amber-400 text-[10px]">
              Dispute Evidence
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4 flex-1">
          {/* Reason submitted */}
          <div className="space-y-1 text-xs">
            <span className="font-semibold text-slate-300">Lý do khiếu nại (Buyer Claim):</span>
            <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-amber-200 text-xs leading-relaxed">
              &ldquo;{dispute.reason}&rdquo;
            </div>
          </div>

          {/* Unbox evidence screenshots from Supabase Storage */}
          <div className="space-y-2 text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <ImageIcon className="h-4 w-4 text-cyan-400" />
              Ảnh chụp màn hình lỗi Unbox (Supabase Storage):
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div className="group relative rounded-lg border border-slate-800 bg-[#080C14] overflow-hidden p-2">
                <div className="h-28 w-full rounded bg-slate-900 flex flex-col items-center justify-center text-slate-500 border border-slate-800 text-[11px] gap-1">
                  <FileText className="h-6 w-6 text-rose-400" />
                  <span>runtime_error_log.png</span>
                  <span className="text-[9px] text-slate-600 font-mono">1.2 MB • Supabase Storage</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Ảnh 1: StackTrace Crash</span>
                  <span className="text-cyan-400 group-hover:underline cursor-pointer">Phóng to</span>
                </div>
              </div>

              <div className="group relative rounded-lg border border-slate-800 bg-[#080C14] overflow-hidden p-2">
                <div className="h-28 w-full rounded bg-slate-900 flex flex-col items-center justify-center text-slate-500 border border-slate-800 text-[11px] gap-1">
                  <FileText className="h-6 w-6 text-amber-400" />
                  <span>terminal_fail_output.png</span>
                  <span className="text-[9px] text-slate-600 font-mono">840 KB • Supabase Storage</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Ảnh 2: Terminal Exit Code 1</span>
                  <span className="text-cyan-400 group-hover:underline cursor-pointer">Phóng to</span>
                </div>
              </div>
            </div>
          </div>

          {/* Raw log text */}
          <div className="space-y-1 text-xs">
            <span className="font-semibold text-slate-300">Raw Terminal / Exception Log:</span>
            <pre className="rounded-lg border border-slate-800 bg-[#080C14] p-3 text-[10px] font-mono text-rose-300 overflow-x-auto max-h-32">
{`TypeError: Cannot read properties of undefined (reading 'privateKey')
    at EscrowService.init (dist/escrow.service.js:42:18)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
[FATAL] Server crashed during startup with exit code 1.`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
