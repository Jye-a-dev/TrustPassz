import { create } from "zustand";
import { persist } from "zustand/middleware";

// FIX C2: AuthUser chỉ chứa metadata không nhạy cảm.
// accessToken KHÔNG được lưu ở đây — JWT sống trong httpOnly cookie do server quản lý.
export interface AuthUser {
  id: string;
  email?: string | null;
  walletAddress?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** Ghi thông tin user sau khi server xác thực thành công và set cookie */
  setAuth: (user: AuthUser) => void;
  /** Xóa state local — cookie được xóa bởi POST /api/v1/auth/logout ở server */
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setAuth: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      // FIX C2: Chỉ persist metadata user — KHÔNG persist token
      name: "trustpassz-auth-session",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
