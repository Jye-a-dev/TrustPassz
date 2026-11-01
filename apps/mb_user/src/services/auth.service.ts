/**
 * TrustPassz Mobile - AuthService
 * Strictly verifies identity tokens and communicates with NestJS backend.
 * Eliminates static/dummy bearer tokens and enforces valid 3-segment JWT assertions.
 */

import { apiClient, ApiError } from '../api/apiClient';

export interface VerifyAuthPayload {
  token: string;
  provider: 'google' | 'privy' | 'solana' | 'dev';
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  walletAddress?: string;
  solanaPublicKey?: string;
  solanaSignature?: string;
  solanaMessage?: string;
}

export interface UserProfile {
  id: string;
  email?: string | null;
  displayName?: string | null;
  walletAddress?: string | null;
  avatarUrl?: string | null;
  role: string;
  createdAt?: string;
}

export interface AuthVerifyResponse {
  accessToken: string;
  user: UserProfile;
}

export class AuthService {
  private static instance: AuthService | null = null;
  private currentUser: UserProfile | null = null;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Verifies Google OAuth ID Token strictly.
   * Throws an error immediately if token does not conform to the 3-segment JWT specification.
   *
   * @param idToken Real JWT string (Header.Payload.Signature) from GoogleSignin
   * @param email Optional user email returned from Google
   */
  public async verifyGoogleAuth(
    idToken: string,
    email?: string,
  ): Promise<AuthVerifyResponse> {
    if (!idToken || typeof idToken !== 'string') {
      throw new Error('Google ID Token không được để trống');
    }

    const trimmed = idToken.trim();
    const segments = trimmed.split('.');
    if (segments.length !== 3) {
      throw new Error(
        'Token không đúng định dạng JWT (yêu cầu 3 segments phân tách bởi dấu chấm)',
      );
    }

    const payload: VerifyAuthPayload = {
      token: trimmed,
      provider: 'google',
      email: email?.trim(),
    };

    return this.verifyAndAuthenticate(payload);
  }

  /**
   * Universal verify endpoint communicating with NestJS POST /api/v1/auth/verify
   */
  public async verifyAndAuthenticate(
    payload: VerifyAuthPayload,
  ): Promise<AuthVerifyResponse> {
    // Defense-in-depth: Validate token format if provider is google
    if (payload.provider === 'google') {
      const segments = payload.token.trim().split('.');
      if (segments.length !== 3) {
        throw new Error(
          'Token không đúng định dạng JWT (yêu cầu 3 segments phân tách bởi dấu chấm)',
        );
      }
    }

    try {
      const response = await apiClient.post<AuthVerifyResponse>(
        '/api/v1/auth/verify',
        payload,
        { skipAuth: true },
      );

      if (!response || !response.accessToken) {
        throw new Error('Phản hồi xác thực từ server không chứa accessToken hợp lệ');
      }

      this.currentUser = response.user;
      apiClient.setAuthToken(response.accessToken);

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Xác thực thất bại: ${error.message}`);
      }
      throw error;
    }
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  public isAuthenticated(): boolean {
    return Boolean(apiClient.getAuthToken() && this.currentUser);
  }

  public async logout(): Promise<void> {
    try {
      if (apiClient.getAuthToken()) {
        await apiClient.post('/api/v1/auth/logout', {});
      }
    } catch {
      // Ignore network errors during logout teardown
    } finally {
      this.currentUser = null;
      apiClient.setAuthToken(null);
    }
  }
}

export const authService = AuthService.getInstance();

