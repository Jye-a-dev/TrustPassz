import { useAuthStore } from "./auth-store";
import {
  clearClientAuthCookie,
  getClientAuthCookie,
  isTokenExpired,
  setClientAuthCookie,
} from "./jwt-edge";

export const REDIRECT_GUARD_STORAGE_KEY = "tp_redirect_guard";
const REDIRECT_WINDOW_MS = 4000;
const MAX_REDIRECTS_PER_WINDOW = 2;

export function resolveSafeCallbackTarget(rawCallbackUrl: string | null | undefined): string {
  if (!rawCallbackUrl) {
    return "/user";
  }

  let candidate = rawCallbackUrl;
  try {
    candidate = decodeURIComponent(rawCallbackUrl);
  } catch {
    candidate = rawCallbackUrl;
  }

  if (
    candidate.startsWith("/") &&
    !candidate.startsWith("//") &&
    !candidate.startsWith("/login") &&
    !candidate.startsWith("/register")
  ) {
    return candidate;
  }

  return "/user";
}

function readRecentRedirectTimestamps(now: number): number[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.sessionStorage.getItem(REDIRECT_GUARD_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (item): item is number =>
        typeof item === "number" &&
        Number.isFinite(item) &&
        now - item >= 0 &&
        now - item <= REDIRECT_WINDOW_MS
    );
  } catch {
    return [];
  }
}

function writeRedirectTimestamps(timestamps: number[]): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.sessionStorage.setItem(
      REDIRECT_GUARD_STORAGE_KEY,
      JSON.stringify(timestamps)
    );
  } catch {
    // Ignore sessionStorage errors in private/restricted browser modes
  }
}

export function clearRedirectGuard(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.sessionStorage.removeItem(REDIRECT_GUARD_STORAGE_KEY);
  } catch {
    // Ignore sessionStorage errors
  }
}

export interface AuthRedirectEvaluationParams {
  isExpired: boolean;
  isLogout: boolean;
  isEdgeUnauth: boolean;
  isForce: boolean;
  callbackUrl: string | null | undefined;
  alreadyCleanedForQuery: boolean;
  onCleanupExecuted: () => void;
  onNavigate: (target: string) => void;
}

/**
 * Evaluates whether an already-authenticated user on /login or /register
 * can safely auto-redirect, enforcing circuit-breaker protection against loops.
 */
export function evaluateAuthPageRedirect(
  params: AuthRedirectEvaluationParams
): void {
  const {
    isExpired,
    isLogout,
    isEdgeUnauth,
    isForce,
    callbackUrl,
    alreadyCleanedForQuery,
    onCleanupExecuted,
    onNavigate,
  } = params;

  const hasBlockQuery = isExpired || isLogout || isEdgeUnauth || isForce;

  // 1. NEVER auto-redirect when URL carries expired=1, logout=1, edge_unauth=1, or force=1
  if (hasBlockQuery) {
    if (!alreadyCleanedForQuery) {
      onCleanupExecuted();
      const store = useAuthStore.getState();
      const cookieToken = getClientAuthCookie();
      const hasDesyncedOrRejectedSession =
        isExpired ||
        isLogout ||
        isEdgeUnauth ||
        !cookieToken ||
        !store.token ||
        cookieToken !== store.token;

      if (hasDesyncedOrRejectedSession && (store.isAuthenticated || store.user || store.token)) {
        store.clearAuthState();
      } else {
        clearClientAuthCookie();
      }
    }
    return;
  }

  // 2. Require BOTH valid Zustand session (user + unexpired token) AND matching client cookie
  const store = useAuthStore.getState();
  const { user, token, isAuthenticated } = store;

  if (!isAuthenticated || !user || !token || isTokenExpired(token, 15)) {
    return;
  }

  let cookieToken = getClientAuthCookie();
  if (cookieToken !== token) {
    setClientAuthCookie(token);
    cookieToken = getClientAuthCookie();
  }

  if (cookieToken !== token) {
    // Browser refused or dropped the cookie; reset store to avoid Edge 307 ping-pong
    store.clearAuthState();
    return;
  }

  // 3. Circuit breaker: block > 2 redirects within 4 seconds via sessionStorage (`tp_redirect_guard`)
  const now = Date.now();
  const recentTimestamps = readRecentRedirectTimestamps(now);

  if (recentTimestamps.length >= MAX_REDIRECTS_PER_WINDOW) {
    store.clearAuthState();
    writeRedirectTimestamps(recentTimestamps);
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      onNavigate("/login");
    }
    return;
  }

  writeRedirectTimestamps([...recentTimestamps, now]);
  onNavigate(resolveSafeCallbackTarget(callbackUrl));
}
