import { Preferences } from '@capacitor/preferences';
import { apiClient } from './apiClient';
import type { AuthResponse, User } from '../types';

const TOKEN_KEY = 'trustpassz_auth_token';
const USER_KEY = 'trustpassz_user_profile';

export interface VerifyAuthDto {
  provider: 'GOOGLE' | 'PRIVY' | 'SOLANA' | 'DEV';
  token: string;
  walletAddress?: string;
  signature?: string;
  nonce?: string;
}

export async function verifyAndAuthenticate(dto: VerifyAuthDto): Promise<AuthResponse> {
  const result = await apiClient<AuthResponse>('/api/v1/auth/verify', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify(dto),
  });

  if (result.accessToken) {
    await Preferences.set({ key: TOKEN_KEY, value: result.accessToken });
    localStorage.setItem(TOKEN_KEY, result.accessToken);
  }

  if (result.user) {
    await Preferences.set({ key: USER_KEY, value: JSON.stringify(result.user) });
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
  }

  return result;
}

export async function getStoredToken(): Promise<string | null> {
  const { value } = await Preferences.get({ key: TOKEN_KEY });
  return value || localStorage.getItem(TOKEN_KEY);
}

export async function getStoredUser(): Promise<User | null> {
  const { value } = await Preferences.get({ key: USER_KEY });
  const raw = value || localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export async function clearAuthSession(): Promise<void> {
  await Preferences.remove({ key: TOKEN_KEY });
  await Preferences.remove({ key: USER_KEY });
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  try {
    await apiClient('/api/v1/auth/logout', { method: 'POST' });
  } catch {
    // Ignore network error on logout
  }
}

