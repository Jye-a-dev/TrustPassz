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
  _hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
  setAuth: (user: AuthUser, token?: string | null) => void;
  login: (user: AuthUser, token?: string | null) => void;
  updateUser: (fields: Partial<AuthUser>) => void;
  setToken: (token: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  checkSessionExpiry: () => boolean;
  clearAuthState: () => void;
  logout: (isExpired?: boolean) => void;
}

let isLoggingOut = false;

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
      _hasHydrated: false,

      setHasHydrated: (_hasHydrated: boolean) => set({ _hasHydrated }),

      setAuth: (user: AuthUser, token: string | null = null) => {
        const cleanToken = token ? token.trim() : null;
        const isValidJwt = cleanToken ? cleanToken.split(".").length === 3 : false;

        // Only sync to document.cookie if valid 3-part JWT; never overwrite HttpOnly with undefined/null
        if (cleanToken && isValidJwt) {
          setClientAuthCookie(cleanToken);
        }

        set({
          user,
          token: cleanToken && isValidJwt ? cleanToken : get().token,
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
        const cleanToken = token ? token.trim() : null;
        if (cleanToken && cleanToken.split(".").length === 3) {
          setClientAuthCookie(cleanToken);
          set({ token: cleanToken });
        } else if (!cleanToken) {
          clearClientAuthCookie();
          set({ token: null });
        }
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

        if (currentToken && isTokenExpired(currentToken, 15)) {
          if (get().isAuthenticated) {
            get().logout(true);
            return true;
          }
          get().clearAuthState();
          return false;
        }

        if (currentToken && currentToken.split(".").length === 3) {
          if (getClientAuthCookie() !== currentToken) {
            setClientAuthCookie(currentToken);
          }
          if (!get().token) {
            set({ token: currentToken });
          }
        }

        return false;
      },

      logout: (isExpired = false) => {
        if (isLoggingOut) {
          return;
        }
        isLoggingOut = true;

        try {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });

          clearClientAuthCookie();
          removePersistedAuthStorage();

          if (typeof window !== "undefined") {
            // Asynchronously invalidate server-side HttpOnly cookie session via first-party rewrite
            fetch("/api/v1/auth/logout", {
              method: "POST",
              credentials: "include",
            }).catch(() => {});

            const currentPath = window.location.pathname;
            if (currentPath !== "/login") {
              const targetUrl = isExpired ? "/login?expired=1" : "/login";
              window.location.replace(targetUrl);
            }
          }
        } finally {
          if (typeof window !== "undefined") {
            window.setTimeout(() => {
              isLoggingOut = false;
            }, 1000);
          } else {
            isLoggingOut = false;
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
      onRehydrateStorage: () => (rehydratedState) => {
        useAuthStore.setState({ _hasHydrated: true });
        if (!rehydratedState) {
          return;
        }

        const { token, user } = rehydratedState;
        if (token) {
          if (!isTokenExpired(token, 15) && token.split(".").length === 3) {
            setClientAuthCookie(token);
            return;
          }
          rehydratedState.clearAuthState();
        } else if (!user) {
          clearClientAuthCookie();
        }
      },
    }
  )
);

export const authStore = useAuthStore;
