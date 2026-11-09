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
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="text-slate-500 hover:text-slate-800 transition-colors">Hạ Tầng</span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-900 font-semibold">Cấp Vốn Gas</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs h-8.5 gap-1.5 shadow-2xs font-medium self-start sm:self-auto"
        >
          <Zap className="h-4 w-4 text-slate-600" />
          <span>Mở Faucet &amp; VietQR Hub</span>
        </Button>
      </div>

      <div>
        <h2 className="text-base font-bold text-slate-900">Trung Tâm Cấp Vốn &amp; Quản Trị Gas Relayer</h2>
        <p className="text-xs text-slate-500">Quản trị quỹ Gas cho Base Sepolia (EVM) và Solana Devnet.</p>
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

