import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AdminUser, UserRole } from '@/types';
import {
  setAdminAuthCookie,
  clearAdminAuthCookie,
  isTokenExpired,
} from './jwt-edge';

export interface AdminAuthState {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setSession: (token: string | null | undefined, user: AdminUser) => boolean;
  setAuth: (user: AdminUser, token?: string | null) => boolean;
  login: (user: AdminUser, token?: string | null) => boolean;
  updateUser: (user: Partial<AdminUser>) => void;
  logout: (isExpired?: boolean) => void;
  hasRole: (roles: UserRole[]) => boolean;
}

const ALLOWED_ROLES: UserRole[] = ['ADMIN', 'SUPER_ADMIN', 'ARBITRATOR'];

let isLoggingOut = false;

export const useAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => {
      const applySession = (token: string | null | undefined, user: AdminUser): boolean => {
        if (!ALLOWED_ROLES.includes(user.role)) {
          set({ user: null, token: null, isAuthenticated: false, isLoading: false, _hasHydrated: true });
          clearAdminAuthCookie();
          return false;
        }

        const cleanToken = token ? token.trim() : null;
        const isValidJwt = cleanToken ? cleanToken.split('.').length === 3 : false;

        if (cleanToken && isValidJwt) {
          setAdminAuthCookie(cleanToken);
        }

        set({
          user,
          token: cleanToken && isValidJwt ? cleanToken : (get().token ?? null),
          isAuthenticated: true,
          isLoading: false,
          _hasHydrated: true,
        });
        return true;
      };

      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        _hasHydrated: false,

        setHasHydrated: (_hasHydrated: boolean) => set({ _hasHydrated }),
        setLoading: (isLoading: boolean) => set({ isLoading }),

        setSession: (token: string | null | undefined, user: AdminUser) =>
          applySession(token, user),
        setAuth: (user: AdminUser, token?: string | null) =>
          applySession(token, user),
        login: (user: AdminUser, token?: string | null) =>
          applySession(token, user),

        updateUser: (partialUser) => {
          const currentUser = get().user;
          if (currentUser) {
            set({ user: { ...currentUser, ...partialUser } });
          }
        },

        logout: (isExpired = false) => {
          if (isLoggingOut) {
            return;
          }
          isLoggingOut = true;

          try {
            set({ user: null, token: null, isAuthenticated: false, isLoading: false, _hasHydrated: true });
            clearAdminAuthCookie();

            if (typeof window !== 'undefined') {
              try {
                localStorage.removeItem('trustpassz-admin-auth');
                sessionStorage.clear();
              } catch {
                // ignore storage access errors
              }

              // Invalidate HttpOnly cookie on backend via first-party rewrite
              fetch('/api/v1/auth/logout', {
                method: 'POST',
                credentials: 'include',
              }).catch(() => {});

              if (window.location.pathname !== '/login') {
                const targetUrl = isExpired ? '/login?expired=1' : '/login';
                window.location.replace(targetUrl);
              }
            }
          } finally {
            if (typeof window !== 'undefined') {
              window.setTimeout(() => {
                isLoggingOut = false;
              }, 1000);
            } else {
              isLoggingOut = false;
            }
          }
        },

        hasRole: (roles: UserRole[]) => {
          const user = get().user;
          if (!user) return false;
          return roles.includes(user.role);
        },
      };
    },
    {
      name: 'trustpassz-admin-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        useAuthStore.setState({ _hasHydrated: true, isLoading: false });
        if (!state) return;
        const token = state.token;
        if (token) {
          if (!isTokenExpired(token, 15) && token.split('.').length === 3) {
            setAdminAuthCookie(token);
            useAuthStore.setState({ _hasHydrated: true, isLoading: false });
          } else {
            useAuthStore.setState({ user: null, token: null, isAuthenticated: false, isLoading: false, _hasHydrated: true });
            clearAdminAuthCookie();
          }
        } else if (!state.user) {
          clearAdminAuthCookie();
          useAuthStore.setState({ _hasHydrated: true, isLoading: false });
        } else {
          useAuthStore.setState({ _hasHydrated: true, isLoading: false });
        }
      },
    }
  )
);

export const useAdminAuthStore = useAuthStore;
