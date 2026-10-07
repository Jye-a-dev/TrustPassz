'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { KeyRound, Cpu, Compass } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { AuthErrorBanner } from '@/components/auth/auth-error-banner';
import { StandardLoginTab } from '@/components/auth/standard-login-tab';
import { useAdminAuthHandlers } from '@/components/auth/use-admin-auth-handlers';

// Code-split Web3/Passkey tab for efficient hydration
const Web3PasskeyTab = dynamic(
  () => import('@/components/auth/web3-passkey-tab').then((mod) => mod.Web3PasskeyTab),
  {
    loading: () => (
      <div className="flex h-36 items-center justify-center">
        <div className="size-5 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    ),
  }
);

type AuthTab = 'standard' | 'web3';

function LoginFormContent() {
  const [activeTab, setActiveTab] = React.useState<AuthTab>('web3');

  const {
    connected,
    publicKey,
    disconnect,
    isSolanaLoading,
    solanaStep,
    isGoogleLoading,
    isPasskeyLoading,
    isLoadingEmail,
    errorMessage,
    setErrorMessage,
    safeCallbackUrl,
    handleSolanaSignIn,
    handleGoogleSuccess,
    handlePasskeySignIn,
    onEmailSubmit,
  } = useAdminAuthHandlers();

  return (
    <Card className="rounded-2xl border-slate-800/80 bg-slate-900/60 shadow-[0_0_50px_rgba(6,182,212,0.08)] backdrop-blur-xl">
      <CardHeader className="space-y-2 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <span>Cổng Xác Thực Quản Trị</span>
          </CardTitle>
          <div className="flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-2.5 py-0.5 text-[11px] font-mono text-cyan-300">
            <Compass className="size-3 text-cyan-400" />
            <span>Chuyển tiếp: {safeCallbackUrl}</span>
          </div>
        </div>
        <CardDescription className="text-xs text-slate-400">
          Chỉ dành riêng cho Quản trị viên (ADMIN) và Hội đồng Trọng tài (ARBITRATOR).
        </CardDescription>

        {/* Tab Navigation Segmented Controller */}
        <div className="pt-2">
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-800 bg-[#070A12]/90 p-1 font-medium sm:flex">
            <button
              type="button"
              onClick={() => setActiveTab('web3')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs transition-all cursor-pointer min-h-10 ${
                activeTab === 'web3'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="size-3.5" />
              <span>Google &amp; Ví Web3</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('standard')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs transition-all cursor-pointer min-h-10 ${
                activeTab === 'standard'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="size-3.5" />
              <span>Mật Khẩu</span>
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        <AuthErrorBanner errorMessage={errorMessage} onClear={() => setErrorMessage(null)} />

        {activeTab === 'web3' && (
          <Web3PasskeyTab
            connected={connected}
            publicKey={publicKey}
            isSolanaLoading={isSolanaLoading}
            solanaStep={solanaStep}
            onSolanaSignIn={handleSolanaSignIn}
            onDisconnect={disconnect}
            onGoogleSuccess={handleGoogleSuccess}
            isGoogleLoading={isGoogleLoading}
            isPasskeyLoading={isPasskeyLoading}
            onPasskeySignIn={handlePasskeySignIn}
          />
        )}

        {activeTab === 'standard' && (
          <StandardLoginTab
            onLogin={onEmailSubmit}
            isLoading={isLoadingEmail}
          />
        )}
      </CardContent>

      <CardFooter className="flex flex-col space-y-2 border-t border-slate-800/80 pt-4">
        <div className="flex w-full items-center justify-between text-xs text-slate-400">
          <span>Chưa có chứng thư Arbitrator?</span>
          <Link href="/register" className="text-cyan-400 hover:underline">
            Kích hoạt Onboarding &rarr;
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="h-115 w-full animate-pulse rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl" />
      }
    >
      <LoginFormContent />
    </React.Suspense>
  );
}
