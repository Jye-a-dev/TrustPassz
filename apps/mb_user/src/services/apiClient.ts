import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const RESOLVED_API_BASE = (() => {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (envUrl) {
    if (Capacitor.getPlatform() === 'android') {
      return envUrl.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
    }
    return envUrl;
  }
  return Capacitor.getPlatform() === 'android'
    ? 'http://10.0.2.2:3001'
    : 'http://localhost:3001';
})();

export const API_BASE_URL = RESOLVED_API_BASE;

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  skipAuth?: boolean;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = 10000, skipAuth = false, headers = {}, ...restConfig } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const requestHeaders: Record<string, string> = {
    'Accept': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (!(restConfig.body instanceof FormData)) {
    requestHeaders['Content-Type'] = requestHeaders['Content-Type'] || 'application/json';
  }

  if (!skipAuth) {
    const tokenResult = await Preferences.get({ key: 'trustpassz_auth_token' });
    const token = tokenResult.value || localStorage.getItem('trustpassz_auth_token');
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...restConfig,
      headers: requestHeaders,
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errorBody = await response.text();
      let parsedMessage: string = errorBody;
      try {
        const jsonErr = JSON.parse(errorBody);
        parsedMessage = jsonErr.message || jsonErr.error || errorBody;
      } catch {
        // use raw body
      }
      throw new Error(`[API ${response.status}] ${parsedMessage}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return (await response.json()) as T;
    }
    return (await response.text()) as unknown as T;
  } catch (error: unknown) {
    clearTimeout(timer);
    const err = error as Error;
    console.error(`[TrustPassz-Capacitor] ❌ API Request Failure: ${url}`, err.message);
    throw err;
  }
}

