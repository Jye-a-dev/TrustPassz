import React from 'react';
import { useAuthStore } from '../../stores/useAuthStore';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title = 'TrustPassz',
  showBack = false,
  onBack,
}) => {
  const { user, logout } = useAuthStore();

  return (
    <header className="w-full bg-[#080C14] border-b border-[#1E293B] px-4 py-3 flex items-center justify-between z-30">
      <div className="flex items-center gap-3">
        {showBack && onBack ? (
          <button
            onClick={onBack}
            className="w-10 h-10 -ml-1 rounded-xl bg-[#0F172A] border border-[#1E293B] flex items-center justify-center text-slate-300 hover:text-white active:scale-95 transition-transform"
            aria-label="Quay lại"
          >
            ←
          </button>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 font-bold text-slate-950 text-sm">
            TP
          </div>
        )}
        <div>
          <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
            {title}
          </h1>
          <p className="text-[10px] text-cyan-400/80 font-mono tracking-wider">
            CAPACITOR ESCROW MOBILE
          </p>
        </div>
      </div>

      {user && (
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-xs font-medium text-slate-200 truncate max-w-[110px]">
              {user.displayName || user.email?.split('@')[0]}
            </p>
            <p className="text-[10px] text-emerald-400 font-mono">
              {user.role}
            </p>
          </div>
          <button
            onClick={logout}
            className="p-2 text-xs text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800/50 active:scale-95 transition"
            title="Đăng xuất"
          >
            Thoát
          </button>
        </div>
      )}
    </header>
  );
};

