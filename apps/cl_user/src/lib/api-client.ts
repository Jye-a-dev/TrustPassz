import { useAuthStore } from "./auth-store";
import { getClientAuthCookie, isTokenExpired } from "./jwt-edge";

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = "ApiError";
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  timeoutMs?: number;
  skipAuthCheck?: boolean;
}

let isLoggingOut = false;

function isOnAuthPage(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const { pathname } = window.location;
  return pathname === "/login" || pathname === "/register";
}

function triggerSafeLogout(): void {
  if (isLoggingOut) {
    return;
  }

  const store = useAuthStore.getState();
  if (!store.isAuthenticated || isOnAuthPage()) {
    return;
  }

  isLoggingOut = true;
  try {
    store.logout(true);
  } finally {
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        isLoggingOut = false;
      }, 2000);
    } else {
      isLoggingOut = false;
    }
  }
}

function resolveBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:3000`;
  }
  return "http://localhost:3000";
}

function buildFinalUrl(
  fullUrl: string,
  params?: Record<string, string | number | boolean | undefined | null>
): string {
  if (!params) {
    return fullUrl;
  }

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      searchParams.append(key, String(val));
    }
  });

  const queryString = searchParams.toString();
  if (!queryString) {
    return fullUrl;
  }

  return `${fullUrl}${fullUrl.includes("?") ? "&" : "?"}${queryString}`;
}

/**
 * Robust HTTP client with Request & Response Interceptors:
 * - Request Interceptor: Always attaches `Authorization: Bearer <token>` from Zustand store (fallback cookie)
 *   for cross-origin Vercel -> Render requests where third-party cookies are blocked.
 * - Response Interceptor: Intercepts HTTP 401 and safely invokes `logout(true)` once via `isLoggingOut` lock.
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    params,
    timeoutMs = 15000,
    headers,
    skipAuthCheck = false,
    ...customConfig
  } = options;

  const baseUrl = resolveBaseUrl();
  const fullUrl =
    endpoint.startsWith("http://") || endpoint.startsWith("https://")
      ? endpoint
      : `${baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  // ==========================================
  // REQUEST INTERCEPTOR: Bearer Token & Expiry Check
  // ==========================================
  const store = useAuthStore.getState();
  const rawToken = store.token || getClientAuthCookie();
  let activeToken: string | null = null;

  if (rawToken) {
    if (!isTokenExpired(rawToken, 15)) {
      activeToken = rawToken;
    } else if (!skipAuthCheck && store.isAuthenticated && !isOnAuthPage()) {
      triggerSafeLogout();
      throw new ApiError(
        401,
        "Unauthorized: Token expired during proactive request check"
      );
    }
  }

  const finalUrl = buildFinalUrl(fullUrl, params);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const normalizedCustomHeaders: Record<string, string> = {};
  if (headers) {
    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        normalizedCustomHeaders[key] = value;
      });
    } else if (Array.isArray(headers)) {
      headers.forEach(([key, value]) => {
        normalizedCustomHeaders[key] = value;
      });
    } else {
      Object.assign(normalizedCustomHeaders, headers);
    }
  }

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...normalizedCustomHeaders,
    ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
  };

  try {
    const response = await fetch(finalUrl, {
      credentials: "include",
      ...customConfig,
      headers: requestHeaders,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // ===========================================
    // RESPONSE INTERCEPTOR: Reactive 401 Intercept
    // ===========================================
    if (response.status === 401) {
      triggerSafeLogout();
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }
      throw new ApiError(
        401,
        "Unauthorized: Session invalidated by server",
        errorData
      );
    }

    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }
      throw new ApiError(response.status, response.statusText, errorData);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(408, "Request Timeout");
    }
    throw new ApiError(
      500,
      error instanceof Error ? error.message : "Network Error"
    );
  }
}
