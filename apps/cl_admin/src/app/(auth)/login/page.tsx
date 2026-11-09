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
        <div className="size-5 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
      </div>
    ),
  }
);

type AuthTab = 'standard' | 'web3';

function LoginFormContent() {
  const [activeTab, setActiveTab] = React.useState<AuthTab>('standard');

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
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-5">
      <div className="space-y-1 pb-1 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold tracking-tight text-slate-900">
            Cổng Xác Thực Quản Trị
          </h2>
          {safeCallbackUrl && safeCallbackUrl !== '/dashboard' && (
            <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-mono text-slate-600">
              <Compass className="size-3 text-slate-500" />
              <span>Chuyển tiếp: {safeCallbackUrl}</span>
            </div>
          )}
        </div>
        <p className="text-xs text-slate-500">
          Dành cho Quản trị viên (ADMIN) và Hội đồng Trọng tài viên (ARBITRATOR).
        </p>

        {/* Tab Navigation Segmented Controller */}
        <div className="pt-3">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('standard')}
              className={`rounded-lg py-2 font-semibold transition-all cursor-pointer min-h-10 flex items-center justify-center gap-1.5 ${
                activeTab === 'standard'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <KeyRound className="size-3.5" />
              <span>Mật Khẩu Chuẩn</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('web3')}
              className={`rounded-lg py-2 transition-all cursor-pointer min-h-10 flex items-center justify-center gap-1.5 ${
                activeTab === 'web3'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Cpu className="size-3.5" />
              <span>Web3 & Passkey</span>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-1">
        <AuthErrorBanner errorMessage={errorMessage} onClear={() => setErrorMessage(null)} />

        {activeTab === 'standard' && (
          <StandardLoginTab
            onLogin={onEmailSubmit}
            isLoading={isLoadingEmail}
          />
        )}

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
      </div>

      <div className="flex flex-col space-y-2 border-t border-slate-100 pt-4">
        <div className="flex w-full items-center justify-between text-xs text-slate-500">
          <span>Chưa có chứng thư Arbitrator?</span>
          <Link href="/register" className="font-semibold text-slate-900 hover:underline">
            Kích hoạt Onboarding &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="h-105 w-full animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" />
      }
    >
      <LoginFormContent />
    </React.Suspense>
  );
}
