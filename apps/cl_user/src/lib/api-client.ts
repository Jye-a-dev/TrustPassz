import { authStore } from "./auth-store";
import { isTokenExpired } from "./jwt-edge";

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

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Robust HTTP client with Request & Response Interceptors:
 * - Request Interceptor: Proactive token expiration check with safe buffer window.
 * - Response Interceptor: Intercepts 401 Unauthorized and halts execution by triggering logout(true).
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, timeoutMs = 15000, headers, skipAuthCheck = false, ...customConfig } = options;

  // Resolve base API URL if relative endpoint passed
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.hostname}:3001`
      : "http://localhost:3001");

  const fullUrl = endpoint.startsWith("http://") || endpoint.startsWith("https://")
    ? endpoint
    : `${baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  // ==========================================
  // REQUEST INTERCEPTOR: Proactive Expiry Check
  // ==========================================
  const activeToken = authStore.getState().token || getCookie("access_token");

  if (!skipAuthCheck && activeToken) {
    if (isTokenExpired(activeToken, 15)) {
      authStore.getState().logout(true);
      throw new ApiError(401, "Unauthorized: Token expired during proactive request check");
    }
  }

  let finalUrl = fullUrl;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      finalUrl += (finalUrl.includes("?") ? "&" : "?") + queryString;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
    ...(headers as Record<string, string> | undefined),
  };

  try {
    const response = await fetch(finalUrl, {
      ...customConfig,
      headers: requestHeaders,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // ===========================================
    // RESPONSE INTERCEPTOR: Reactive 401 Intercept
    // ===========================================
    if (response.status === 401) {
      authStore.getState().logout(true);
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }
      throw new ApiError(401, "Unauthorized: Session invalidated by server", errorData);
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
    throw new ApiError(500, error instanceof Error ? error.message : "Network Error");
  }
}
