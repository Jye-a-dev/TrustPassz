import React, { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';

interface LoginScreenProps {
  onSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const { login, isLoading } = useAuthStore();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [walletInput, setWalletInput] = useState('0x71C...49b2');

  const handleDevOrGoogleLogin = async (provider: 'DEV' | 'GOOGLE' | 'SOLANA') => {
    setErrorMessage(null);
    try {
      if (provider === 'GOOGLE') {
        // Mocking client-side Google auth prompt in webview or exchange idToken
        const googleToken = 'mock_google_id_token_for_verify';
        await login({
          provider: 'GOOGLE',
          token: googleToken,
        });
      } else if (provider === 'SOLANA') {
        await login({
          provider: 'SOLANA',
          token: 'siws_solana_signature',
          walletAddress: walletInput,
        });
      } else {
        // Quick dev auth login with backend verify endpoint
        await login({
          provider: 'DEV',
          token: 'dev_test_session_token',
        });
      }
      onSuccess();
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || 'Đăng nhập không thành công. Kiểm tra kết nối server.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#080C14] text-slate-100 justify-between p-6 select-none">
      <div className="pt-8 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 to-emerald-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-cyan-500/25">
          TP
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Đăng Nhập Khóa Ký Quỹ
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          Xác thực danh tính để tạo kèo đàm phán, thanh toán VietQR và giải mã Digital Vault.
        </p>
      </div>

      <div className="my-auto space-y-4">
        {errorMessage && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        <button
          onClick={() => handleDevOrGoogleLogin('GOOGLE')}
          disabled={isLoading}
          className="w-full h-13 py-3.5 px-4 bg-[#0F172A] hover:bg-slate-800 active:scale-95 border border-[#1E293B] rounded-2xl flex items-center justify-center gap-3 text-sm font-semibold transition-all disabled:opacity-60"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Tiếp tục với Google OAuth</span>
        </button>

        <div className="relative py-2 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#1E293B]"></div>
          </div>
          <span className="relative bg-[#080C14] px-3 text-[11px] text-slate-500 uppercase font-mono">
            Hoặc chế độ dev
          </span>
        </div>

        <div className="p-4 bg-[#0F172A] border border-[#1E293B] rounded-2xl space-y-3">
          <p className="text-[11px] text-slate-400 font-mono">Ví / Danh tính kiểm thử LAN:</p>
          <input
            type="text"
            value={walletInput}
            onChange={(e) => setWalletInput(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#080C14] border border-[#1E293B] rounded-xl text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={() => handleDevOrGoogleLogin('DEV')}
            disabled={isLoading}
            className="w-full h-12 bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-bold rounded-xl text-xs transition shadow-md shadow-cyan-500/20"
          >
            {isLoading ? 'Đang xác thực...' : 'Đăng Nhập Nhanh (Dev & Testing)'}
          </button>
        </div>
      </div>

      <div className="text-center pb-2">
        <p className="text-[11px] text-slate-500 font-mono">
          Tuân thủ chuẩn bảo mật TrustPassz Escrow Protocol
        </p>
      </div>
    </div>
  );
};

