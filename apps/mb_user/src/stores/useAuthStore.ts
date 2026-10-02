import { create } from 'zustand';
import type { User } from '../types';
import {
  getStoredToken,
  getStoredUser,
  verifyAndAuthenticate,
  clearAuthSession,
  type VerifyAuthDto,
} from '../services/auth.service';

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  initAuth: () => Promise<void>;
  login: (dto: VerifyAuthDto) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: false,
  isInitialized: false,

  initAuth: async () => {
    try {
      const [token, user] = await Promise.all([getStoredToken(), getStoredUser()]);
      set({ token, user, isInitialized: true });
    } catch {
      set({ token: null, user: null, isInitialized: true });
    }
  },

  login: async (dto: VerifyAuthDto) => {
    set({ isLoading: true });
    try {
      const authData = await verifyAndAuthenticate(dto);
      set({
        token: authData.accessToken,
        user: authData.user,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    await clearAuthSession();
    set({ token: null, user: null });
  },
}));

