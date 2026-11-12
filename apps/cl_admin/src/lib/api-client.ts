import { toast } from 'sonner';
import { useAuthStore } from './auth-store';
import { getAdminAuthCookie, isTokenExpired } from './jwt-edge';

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  timeoutMs?: number;
}

function resolveBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '';
  }
  return (
    process.env.NEXT_PUBLIC_API_URL || 'https://trustpassz-server.onrender.com'
  ).replace(/\/$/, '');
}

function isAuthEndpoint(url: string): boolean {
  return /\/auth\/(login|verify|nonce|register|logout)/i.test(url);
}

function isOnAuthPage(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const { pathname } = window.location;
  return pathname === '/login' || pathname === '/register';
}

function buildFinalUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined | null>
): string {
  const baseUrl = resolveBaseUrl();
  let fullUrl: string;

  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    fullUrl = endpoint;
  } else if (!baseUrl) {
    fullUrl = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  } else {
    fullUrl = `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  }

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

  return `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}${queryString}`;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, timeoutMs = 15000, headers, ...customConfig } = options;

  const finalUrl = buildFinalUrl(endpoint, params);

  // Retrieve token from Zustand store, fallback to browser cookie
  const storeToken = useAuthStore.getState().token;
  const cookieToken = getAdminAuthCookie();
  const rawToken = storeToken && storeToken.trim() !== '' ? storeToken : cookieToken;

  const authHeaders: Record<string, string> = {};
  if (rawToken && !isTokenExpired(rawToken)) {
    authHeaders['Authorization'] = `Bearer ${rawToken.trim()}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(finalUrl, {
      credentials: 'include',
      ...customConfig,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...authHeaders,
        ...headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 401) {
      const isAuthCall = isAuthEndpoint(finalUrl);
      const isAuthPage = isOnAuthPage();

      if (!isAuthCall && !isAuthPage) {
        if (typeof window !== 'undefined') {
          toast.error('Phiên đăng nhập đã hết hạn (401). Vui lòng đăng nhập lại.');
        }
        useAuthStore.getState().logout(true);
      }

      throw new ApiError(401, response.statusText, 'Unauthorized');
    }

    if (response.status === 403) {
      const isAuthPage = isOnAuthPage();
      if (!isAuthPage && typeof window !== 'undefined') {
        toast.error('Không đủ thẩm quyền thực hiện thao tác (403 Forbidden).');
      }
      throw new ApiError(403, response.statusText, 'Forbidden');
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
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(408, 'Request Timeout');
    }
    throw new ApiError(500, error instanceof Error ? error.message : 'Network Error');
  }
}

apiClient.get = <T>(endpoint: string, options?: RequestOptions) =>
  apiClient<T>(endpoint, { ...options, method: 'GET' });

apiClient.post = <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
  apiClient<T>(endpoint, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });

apiClient.patch = <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
  apiClient<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });

apiClient.delete = <T>(endpoint: string, options?: RequestOptions) =>
  apiClient<T>(endpoint, { ...options, method: 'DELETE' });
