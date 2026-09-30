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

const ALLOWED_ROLES: UserRole[] = ['ADMIN', 'ARBITRATOR'];

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setSession: (token: string, user: AdminUser) => {
        if (!ALLOWED_ROLES.includes(user.role)) {
          // Reject non-admin / non-arbitrator roles
          set({ user: null, token: null, isAuthenticated: false });
          if (typeof document !== 'undefined') {
            document.cookie = 'access_token=; path=/; max-age=0; SameSite=Lax';
          }
          return false;
        }

        set({ user, token, isAuthenticated: true });
        if (typeof document !== 'undefined') {
          // Ensure cookie is available for Next.js Edge Middleware
          document.cookie = `access_token=${token}; path=/; max-age=604800; SameSite=Lax`;
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
          document.cookie = 'access_token=; path=/; max-age=0; SameSite=Lax';
          window.location.href = '/login';
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
