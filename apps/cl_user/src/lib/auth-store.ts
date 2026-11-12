import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  clearClientAuthCookie,
  getClientAuthCookie,
  isTokenExpired,
  setClientAuthCookie,
} from "./jwt-edge";

export const AUTH_STORAGE_KEY = "trustpassz-auth-session";

export interface AuthUser {
  id: string;
  email?: string | null;
  walletAddress?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  role: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: AuthUser, token?: string | null) => void;
  login: (user: AuthUser, token?: string | null) => void;
  updateUser: (fields: Partial<AuthUser>) => void;
  setToken: (token: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  checkSessionExpiry: () => boolean;
  clearAuthState: () => void;
  logout: (isExpired?: boolean) => void;
}

function safeBase64UrlEncode(str: string): string {
  try {
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  } catch {
    return btoa(unescape(encodeURIComponent(str)))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  }
}

/**
 * Creates a base64url JWT representation when needed by legacy callers.
 */
export function generateClientSessionJwt(
  user: AuthUser,
  expiresInSeconds = 7 * 86400
): string {
  const header = safeBase64UrlEncode(
    JSON.stringify({ alg: "HS256", typ: "JWT" })
  );
  const now = Math.floor(Date.now() / 1000);
  const payload = safeBase64UrlEncode(
    JSON.stringify({
      sub: user.id,
      id: user.id,
      email: user.email,
      walletAddress: user.walletAddress,
      displayName: user.displayName,
      role: user.role,
      iat: now,
      exp: now + expiresInSeconds,
    })
  );
  return `${header}.${payload}.client_verified_sig`;
}

function removePersistedAuthStorage(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Ignore storage access errors in restricted browser contexts
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user: AuthUser, token: string | null = null) => {
        const resolvedToken =
          token ||
          get().token ||
          getClientAuthCookie() ||
          generateClientSessionJwt(user);

        setClientAuthCookie(resolvedToken);

        set({
          user,
          token: resolvedToken,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      login: (user: AuthUser, token: string | null = null) => {
        get().setAuth(user, token);
      },

      updateUser: (fields: Partial<AuthUser>) => {
        const currentUser = get().user;
        if (!currentUser) return;
        set({ user: { ...currentUser, ...fields } });
      },

      setToken: (token: string | null) => {
        if (token) {
          setClientAuthCookie(token);
        } else {
          clearClientAuthCookie();
        }
        set({ token });
      },

      setLoading: (isLoading: boolean) => set({ isLoading }),

      clearAuthState: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        clearClientAuthCookie();
        removePersistedAuthStorage();
      },

      checkSessionExpiry: (): boolean => {
        const currentToken = get().token || getClientAuthCookie();

        if (!currentToken || isTokenExpired(currentToken, 15)) {
          if (get().isAuthenticated) {
            get().logout(true);
            return true;
          }
          get().clearAuthState();
          return false;
        }

        if (getClientAuthCookie() !== currentToken) {
          setClientAuthCookie(currentToken);
        }

        if (!get().token) {
          set({ token: currentToken });
        }

        return false;
      },

      logout: (isExpired = false) => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });

        clearClientAuthCookie();
        removePersistedAuthStorage();

        if (typeof window !== "undefined") {
          const currentPath = window.location.pathname;
          if (currentPath !== "/login") {
            const targetUrl = isExpired ? "/login?expired=1" : "/login";
            window.location.replace(targetUrl);
          }
        }
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (rehydratedState, error) => {
        if (error || !rehydratedState) {
          return;
        }

        const { token, user, isAuthenticated } = rehydratedState;
        if (token && !isTokenExpired(token, 15) && user) {
          setClientAuthCookie(token);
          return;
        }

        if (token || isAuthenticated || user) {
          rehydratedState.clearAuthState();
        }
      },
    }
  )
);

export const authStore = useAuthStore;
