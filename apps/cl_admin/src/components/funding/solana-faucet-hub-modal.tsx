'use client';

import * as React from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import {
  Copy,
  ExternalLink,
  Fuel,
  Globe,
  Loader2,
  QrCode,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FiatTopupTab } from './fiat-topup-tab';
import { toast } from 'sonner';

const DEFAULT_SOLANA_RELAYER_ADDRESS =
  process.env.NEXT_PUBLIC_SOLANA_RELAYER_ADDRESS ||
  'F9zXgYmojDjHnjiRCtNLb46ruUorjrWeEDBxF2dFkJjn';

interface SolanaFaucetHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  relayerAddress?: string;
  onSuccessFund?: () => void;
}

export function SolanaFaucetHubModal({
  isOpen,
  onClose,
  relayerAddress = DEFAULT_SOLANA_RELAYER_ADDRESS,
  onSuccessFund,
}: SolanaFaucetHubModalProps) {
  const { connection } = useConnection();
  const activeRelayerAddress = relayerAddress || DEFAULT_SOLANA_RELAYER_ADDRESS;

  const [activeTab, setActiveTab] = React.useState<'FAUCET' | 'AIRDROP' | 'FIAT'>('FAUCET');
  const [airdropTarget, setAirdropTarget] = React.useState<string | null>(null);
  const [isAirdropping, setIsAirdropping] = React.useState(false);
  const [copiedTarget, setCopiedTarget] = React.useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTarget(true);
    toast.success('Đã sao chép địa chỉ ví vào bộ nhớ tạm');
    setTimeout(() => setCopiedTarget(false), 2000);
  };

  const handleOpenOfficialFaucet = () => {
    navigator.clipboard.writeText(activeRelayerAddress);
    toast.info('Đã sao chép sẵn địa chỉ ví Relayer. Đang chuyển hướng sang Solana Faucet...');
    window.open('https://faucet.solana.com/', '_blank', 'noopener,noreferrer');
  };

  const handleRequestAirdrop = async () => {
    const target = airdropTarget?.trim() || activeRelayerAddress;
    try {
      new PublicKey(target);
    } catch {
      toast.error('Địa chỉ ví Solana không hợp lệ');
      return;
    }

    setIsAirdropping(true);
    try {
      const pubkey = new PublicKey(target);
      const signature = await connection.requestAirdrop(pubkey, 1 * LAMPORTS_PER_SOL);
      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      });

      toast.success(`Airdrop 1 SOL thành công vào ví ${target.slice(0, 6)}...${target.slice(-6)}`);
      onSuccessFund?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('429') || msg.toLowerCase().includes('rate limit')) {
        toast.error('Solana RPC Devnet bị giới hạn tần suất (Rate Limited). Vui lòng dùng Kênh 3 nạp VietQR.');
      } else {
        toast.error(`Airdrop thất bại: ${msg}`);
      }
    } finally {
      setIsAirdropping(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-slate-200 bg-white text-slate-900 max-w-xl shadow-xl rounded-2xl p-6 text-xs">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-800">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Hub Nạp Gas Solana Devnet &amp; VietQR Fiat
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 pt-0.5">
                Ba kênh cấp vốn SOL: Faucet chính thức, Airdrop RPC 1-click hoặc Chuyển khoản VietQR/USD.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Channel Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono my-1">
          <button
            type="button"
            onClick={() => setActiveTab('FAUCET')}
            className={`py-2 px-2.5 rounded-lg h-10 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'FAUCET'
                ? 'bg-white text-slate-900 font-bold border border-slate-200 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span className="truncate">Kênh 1: Web Faucet</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('AIRDROP')}
            className={`py-2 px-2.5 rounded-lg h-10 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'AIRDROP'
                ? 'bg-white text-slate-900 font-bold border border-slate-200 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span className="truncate">Kênh 2: Airdrop RPC</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FIAT')}
            className={`py-2 px-2.5 rounded-lg h-10 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'FIAT'
                ? 'bg-white text-slate-900 font-bold border border-slate-200 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <QrCode className="h-3.5 w-3.5" />
            <span className="truncate">Kênh 3: VietQR / USD</span>
          </button>
        </div>

        {/* Tab 1: Official Faucet */}
        {activeTab === 'FAUCET' && (
          <div className="space-y-3 py-1 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Địa chỉ ví Relayer cần nạp:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(activeRelayerAddress)}
                  className="h-8 text-xs gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-white"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{copiedTarget ? 'Đã sao chép' : 'Sao chép ví'}</span>
                </Button>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 font-mono text-xs text-slate-800 break-all select-all">
                {activeRelayerAddress}
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Nút bên dưới sẽ tự động sao chép địa chỉ ví Relayer vào clipboard và mở trang Faucet chính thức của Solana Foundation.
              </p>
            </div>

            <Button
              type="button"
              onClick={handleOpenOfficialFaucet}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white h-10 text-xs font-medium gap-2 rounded-xl"
            >
              <span>Mở faucet.solana.com &amp; Copy Ví Tự Động</span>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Tab 2: One-Click RPC Airdrop */}
        {activeTab === 'AIRDROP' && (
          <div className="space-y-3 py-1 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <label className="text-slate-700 font-semibold block">Địa chỉ ví đích (mặc định là ví Relayer):</label>
              <Input
                value={airdropTarget ?? activeRelayerAddress}
                onChange={(e) => setAirdropTarget(e.target.value)}
                placeholder="Nhập địa chỉ ví Solana Base58..."
                className="bg-white border-slate-200 text-slate-900 font-mono text-xs h-10 rounded-lg focus-visible:ring-slate-400"
              />
              <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                <Fuel className="h-3.5 w-3.5 text-emerald-600" />
                <span>Số lượng yêu cầu mỗi lần: <strong className="text-emerald-700 font-mono">1.0 SOL Devnet</strong></span>
              </div>
            </div>

            <Button
              type="button"
              disabled={isAirdropping}
              onClick={handleRequestAirdrop}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white h-10 text-xs font-medium gap-2 rounded-xl"
            >
              {isAirdropping ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang thực thi RPC RequestAirdrop...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  <span>Airdrop Ngay 1 SOL Devnet</span>
                </>
              )}
            </Button>
          </div>
        )}

        {/* Tab 3: VietQR / USD Fiat Engine */}
        {activeTab === 'FIAT' && (
          <FiatTopupTab
            relayerAddress={activeRelayerAddress}
            onSuccessFund={onSuccessFund}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
