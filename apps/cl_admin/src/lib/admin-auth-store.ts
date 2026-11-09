import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AdminUser, UserRole } from '@/types';

interface AdminAuthState {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  setSession: (token: string, user: AdminUser) => boolean;
  updateUser: (user: Partial<AdminUser>) => void;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
}

const ALLOWED_ROLES: UserRole[] = ['ADMIN', 'SUPER_ADMIN', 'ARBITRATOR'];

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setSession: (token: string, user: AdminUser) => {
        const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
        const secureAttr = isSecure ? '; Secure' : '';

        if (!ALLOWED_ROLES.includes(user.role)) {
          // Reject non-admin / non-arbitrator roles
          set({ user: null, token: null, isAuthenticated: false });
          if (typeof document !== 'undefined') {
            document.cookie = `access_token=; path=/; max-age=0; SameSite=Lax${secureAttr}`;
          }
          return false;
        }

        const cleanToken = token.trim();
        set({ user, token: cleanToken, isAuthenticated: true });
        if (typeof document !== 'undefined') {
          // Ensure cookie is available for Next.js Edge Middleware
          document.cookie = `access_token=${cleanToken}; path=/; max-age=604800; SameSite=Lax${secureAttr}`;
        }
        return true;
      },

      updateUser: (partialUser) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...partialUser } });
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });

        if (typeof document !== 'undefined') {
          document.cookie = 'access_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
          document.cookie = 'access_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure';
          document.cookie = 'access_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        }

        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('trustpassz-admin-auth');
            sessionStorage.clear();
          } catch {}

          const apiUrl = (
            process.env.NEXT_PUBLIC_API_URL ||
            `${window.location.protocol}//${window.location.hostname}:3000`
          ).replace(/\/$/, '');

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1000);

          fetch(`${apiUrl}/api/v1/auth/logout`, {
            method: 'POST',
            credentials: 'include',
            signal: controller.signal,
          })
            .catch(() => null)
            .finally(() => {
              clearTimeout(timeoutId);
              window.location.href = '/login?logout=1&force=1';
            });
        }
      },

      hasRole: (roles: UserRole[]) => {
        const user = get().user;
        if (!user) return false;
        return roles.includes(user.role);
      },
    }),
    {
      name: 'trustpassz-admin-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
