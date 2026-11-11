'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  KeyRound,
  ArrowLeft,
  Lock,
  Terminal,
  AlertTriangle,
  Fingerprint,
} from 'lucide-react';

export default function ForbiddenPage() {
  const userPortalUrl =
    process.env.NEXT_PUBLIC_USER_PORTAL_URL || 'http://localhost:3000';

  return (
    <main className="relative min-h-screen w-full bg-[#080C14] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-x-hidden font-sans selection:bg-rose-500/20 selection:text-rose-300">
      {/* Background Cyber Grid & Radial Glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 20%, rgba(239, 68, 68, 0.15) 0%, transparent 60%), linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 32px 32px, 32px 32px',
        }}
      />

      {/* Decorative Cyber Escutcheon Line */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-rose-500/60 to-transparent" />

      <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center text-center">
        {/* Pulsing Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-mono tracking-wider mb-6">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-rose-500" />
          </span>
          <span>HTTP 403 // FORBIDDEN ACCESS VIOLATION</span>
        </div>

        {/* Shield Icon Box */}
        <div className="relative mb-6">
          <div className="absolute -inset-2 rounded-2xl bg-rose-500/20 blur-xl" />
          <div className="relative flex size-20 sm:size-24 items-center justify-center rounded-2xl border border-rose-500/40 bg-[#0B0F17] shadow-2xl shadow-rose-950/50">
            <ShieldAlert className="size-10 sm:size-12 text-rose-500" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-3">
          Truy Cập Bị Từ Chối
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
          Tài khoản hiện tại không có đặc quyền Quản trị viên (
          <code className="text-rose-400 font-mono text-xs px-1.5 py-0.5 rounded bg-rose-950/40 border border-rose-800/40">
            ADMIN
          </code>{' '}
          hoặc{' '}
          <code className="text-rose-400 font-mono text-xs px-1.5 py-0.5 rounded bg-rose-950/40 border border-rose-800/40">
            ARBITRATOR
          </code>
          ) để truy cập vào hệ thống điều hành TrustPassz Admin Portal.
        </p>

        {/* Security Audit Telemetry Box */}
        <div className="w-full rounded-xl border border-slate-800/80 bg-[#0B0F17]/90 p-4 sm:p-5 mb-8 text-left shadow-inner">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Terminal className="size-3.5 text-rose-400" />
              <span>RBAC TELEMETRY // INCIDENT #403-GATE</span>
            </span>
            <span className="text-rose-400 font-semibold">ENFORCED</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center text-slate-400">
              <span className="flex items-center gap-1.5">
                <Lock className="size-3 text-slate-500" />
                <span>Quy chuẩn bảo mật:</span>
              </span>
              <span className="text-slate-200">Zero-Trust Role Check</span>
            </div>

            <div className="flex justify-between items-center text-slate-400">
              <span className="flex items-center gap-1.5">
                <Fingerprint className="size-3 text-slate-500" />
                <span>Yêu cầu cấp phép:</span>
              </span>
              <span className="text-amber-400 font-medium">ADMIN | ARBITRATOR</span>
            </div>

            <div className="flex justify-between items-center text-slate-400">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="size-3 text-rose-500" />
                <span>Chế độ cách ly:</span>
              </span>
              <span className="text-rose-400 font-medium">Network 307 Intercept</span>
            </div>
          </div>
        </div>

        {/* Action Buttons with Touch Targets >= 44px */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
          {/* Primary Action: Login as Admin */}
          <Link
            href="/login?force=1"
            className="w-full sm:w-auto min-h-11 px-6 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:ring-offset-[#080C14] active:scale-[0.98]"
          >
            <KeyRound className="size-4" />
            <span>Đăng nhập bằng tài khoản Quản trị</span>
          </Link>

          {/* Secondary Action: Return to User Portal */}
          <a
            href={userPortalUrl}
            className="w-full sm:w-auto min-h-11 px-6 py-2.5 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-900/60 hover:bg-slate-800 text-slate-200 font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-[#080C14] active:scale-[0.98]"
          >
            <ArrowLeft className="size-4 text-slate-400" />
            <span>Quay lại Cổng Khách hàng</span>
          </a>
        </div>

        {/* Footer Audit Marker */}
        <p className="mt-8 text-[11px] font-mono text-slate-600 tracking-wider">
          TRUSTPASSZ SECURE ESCROW // CRYPTOGRAPHIC AUDIT LOGGED
        </p>
      </div>
    </main>
  );
}
