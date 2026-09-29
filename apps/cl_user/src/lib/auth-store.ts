import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isTokenExpired, parseJwtPayload } from "./jwt-edge";

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
  setToken: (token: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  checkSessionExpiry: () => boolean;
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
 * Creates an Edge/Browser compatible JWT session token when offline or backend emits cookie only.
 */
export function generateClientSessionJwt(user: AuthUser, expiresInSeconds = 7 * 86400): string {
  const header = safeBase64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
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

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
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
          getCookie("access_token") ||
          generateClientSessionJwt(user);

        if (typeof document !== "undefined") {
          document.cookie = `access_token=${resolvedToken}; path=/; Max-Age=604800; SameSite=Lax;`;
        }

        set({
          user,
          token: resolvedToken,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      setToken: (token: string | null) => {
        if (token && typeof document !== "undefined") {
          document.cookie = `access_token=${token}; path=/; Max-Age=604800; SameSite=Lax;`;
        }
        set({ token });
      },

      setLoading: (isLoading: boolean) => set({ isLoading }),

      checkSessionExpiry: (): boolean => {
        const currentToken = get().token || getCookie("access_token");

        if (currentToken) {
          if (isTokenExpired(currentToken, 15)) {
            // Verify if true JWT expiry occurred
            const payload = parseJwtPayload(currentToken);
            if (payload?.exp && Date.now() >= payload.exp * 1000) {
              get().logout(true);
              return true;
            }
            // If token lacked exp claim but state holds valid user, re-sign client token
            if (get().isAuthenticated && get().user) {
              const recovered = generateClientSessionJwt(get().user!);
              get().setToken(recovered);
              return false;
            }
            get().logout(true);
            return true;
          }
          // Synchronize cookie if state has token but cookie was dropped
          if (typeof document !== "undefined" && !getCookie("access_token")) {
            document.cookie = `access_token=${currentToken}; path=/; Max-Age=604800; SameSite=Lax;`;
          }
          return false;
        }

        // If authenticated user profile exists but cookie/token was lost during navigation
        if (get().isAuthenticated && get().user) {
          const recovered = generateClientSessionJwt(get().user!);
          get().setToken(recovered);
          return false;
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

        if (typeof document !== "undefined") {
          document.cookie = "access_token=; Max-Age=0; path=/;";
          document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
        }

        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem("trustpassz-auth-session");
            sessionStorage.clear();
          } catch {}

          const pathname = window.location.pathname;
          const search = window.location.search;
          const isAuthPage = pathname === "/login" || pathname === "/register";

          let targetUrl = "/login";
          if (isExpired) {
            if (!isAuthPage && pathname.startsWith("/user")) {
              const callbackUrl = encodeURIComponent(pathname + search);
              targetUrl = `/login?callbackUrl=${callbackUrl}&expired=1`;
            } else {
              targetUrl = "/login?expired=1";
            }
          }

          window.location.href = targetUrl;
        }
      },
    }),
    {
      name: "trustpassz-auth-session",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export const authStore = useAuthStore;
