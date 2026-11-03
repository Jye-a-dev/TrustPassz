'use client';

import * as React from 'react';
import { Fuel, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RelayerFundingCard } from '@/components/funding/relayer-funding-card';
import { SolanaFaucetHubModal } from '@/components/funding/solana-faucet-hub-modal';

export default function FundingPage() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <Fuel className="h-6 w-6 text-cyan-400" />
            Trung Tâm Cấp Vốn & Quản Trị Gas Solana
          </h2>
          <p className="text-xs text-slate-400">
            Giám sát số dư ví Relayer, airdrop RPC 1-click hoặc nạp tiền Việt (VietQR) / USD chuyển đổi sang SOL.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="border-cyan-500/30 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 text-xs h-9 min-h-11 gap-1.5 self-start sm:self-auto"
        >
          <Zap className="h-4 w-4 text-cyan-400" />
          <span>Mở Faucet & VietQR Hub</span>
        </Button>
      </div>

      <RelayerFundingCard />

      <SolanaFaucetHubModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        relayerAddress={
          process.env.NEXT_PUBLIC_SOLANA_RELAYER_ADDRESS ||
          'F9zXgYmojDjHnjiRCtNLb46ruUorjrWeEDBxF2dFkJjn'
        }
      />
    </div>
  );
}

