/**
 * TrustPassz Mobile - ApiClient
 * Dynamic base URL resolver & type-safe HTTP client for Mobile environment.
 * Complies with Cyber-Escrow architecture & Zero-Regression directives.
 */

import { Platform, NativeModules } from 'react-native';

export interface RequestOptions {
  headers?: Record<string, string>;
  skipAuth?: boolean;
  timeoutMs?: number;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
}

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly responseData?: unknown,
  ) {
    super(`[ApiClient ${statusCode}] ${message}`);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private static instance: ApiClient | null = null;
  private authToken: string | null = null;
  private customBaseUrl: string | null = null;

  private constructor() {}

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  /**
   * Dynamically resolves the API base URL based on runtime environment:
   * 1. EXPO_PUBLIC_API_URL environment variable
   * 2. Host IP dynamically detected from Metro bundler runtime
   * 3. Android Emulator loopback fallback (10.0.2.2:3001)
   * 4. iOS Simulator / Web localhost fallback (localhost:3001)
   */
  public getBaseUrl(): string {
    if (this.customBaseUrl && this.customBaseUrl.trim().length > 0) {
      return this.customBaseUrl.replace(/\/+$/, '');
    }

    const envUrl = process.env.EXPO_PUBLIC_API_URL;
    if (envUrl && envUrl.trim().length > 0) {
      return envUrl.trim().replace(/\/+$/, '');
    }

    // Dynamic runtime resolution from Metro bundle script URL (Wi-Fi real devices)
    try {
      const scriptURL = NativeModules.SourceCode?.scriptURL as string | undefined;
      if (scriptURL) {
        const address = scriptURL.split('://')[1]?.split('/')[0];
        const hostname = address?.split(':')[0];
        if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
          return `http://${hostname}:3001`;
        }
      }
    } catch {
      // Fallback if SourceCode native module unavailable
    }

    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3001';
    }

    return 'http://localhost:3001';
  }

  public setCustomBaseUrl(url: string | null): void {
    this.customBaseUrl = url;
  }

  public setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  public getAuthToken(): string | null {
    return this.authToken;
  }

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    body?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    const baseUrl = this.getBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${baseUrl}${cleanEndpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options?.headers || {}),
    };

    if (!options?.skipAuth && this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, options?.timeoutMs || 15000);

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const contentType = res.headers.get('content-type') || '';
      let data: unknown = null;
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      if (!res.ok) {
        const errMessage =
          typeof data === 'object' && data !== null && 'message' in data
            ? Array.isArray((data as ApiErrorResponse).message)
              ? (data as { message: string[] }).message.join(', ')
              : String((data as ApiErrorResponse).message)
            : res.statusText || `Request failed with HTTP ${res.status}`;
        throw new ApiError(res.status, errMessage, data);
      }

      return data as T;
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof ApiError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ApiError(408, 'Thời gian chờ kết nối máy chủ vượt quá giới hạn (Timeout)');
      }
      throw new ApiError(0, err instanceof Error ? err.message : 'Lỗi kết nối mạng');
    }
  }

  public get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, 'GET', undefined, options);
  }

  public post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, 'POST', body, options);
  }

  public put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, 'PUT', body, options);
  }

  public delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, 'DELETE', undefined, options);
  }

  public patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, 'PATCH', body, options);
  }
}

export const apiClient = ApiClient.getInstance();

