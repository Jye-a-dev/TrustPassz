/**
 * auth-verifier.service.ts
 *
 * Cryptographic verifier for third-party identity assertions:
 *   1. Solana Ed25519 detached signatures (via tweetnacl + bs58)
 *   2. Google OAuth ID Tokens (via official google-auth-library)
 *   3. Privy & general JWT payload extraction
 */

import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import * as nacl from 'tweetnacl';
import bs58 from 'bs58';
import { VerifyAuthDto } from './dto/verify-auth.dto';

export interface DecodedAuthPayload {
  sub?: string;
  email?: string;
  walletAddress?: string;
  displayName?: string;
  avatarUrl?: string;
  iss?: string;
  aud?: string | string[];
}

@Injectable()
export class AuthVerifierService {
  private readonly logger = new Logger(AuthVerifierService.name);
  private readonly googleClient = new OAuth2Client();

  /**
   * Verifies Solana Ed25519 signature using tweetnacl detached verify.
   */
  verifySolanaSignature(
    message: string,
    signature: string,
    publicKey: string,
  ): boolean {
    try {
      const messageBytes = new TextEncoder().encode(message);

      let signatureBytes: Uint8Array;
      const cleanSig = signature.trim();
      if (
        cleanSig.startsWith('0x') ||
        (cleanSig.length === 128 && /^[0-9a-fA-F]+$/.test(cleanSig))
      ) {
        const hexStr = cleanSig.startsWith('0x') ? cleanSig.slice(2) : cleanSig;
        signatureBytes = Uint8Array.from(Buffer.from(hexStr, 'hex'));
      } else {
        signatureBytes = bs58.decode(cleanSig);
      }

      const publicKeyBytes = bs58.decode(publicKey.trim());

      if (signatureBytes.length !== 64 || publicKeyBytes.length !== 32) {
        this.logger.warn(
          `Invalid Solana signature or public key length: sig=${signatureBytes.length}, pubkey=${publicKeyBytes.length}`,
        );
        return false;
      }

      return nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKeyBytes,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Solana signature verification error: ${msg}`);
      return false;
    }
  }

  /**
   * Verifies Google OAuth ID Token strictly via verifyIdToken.
   * Disallows unverified decode fallbacks to prevent token forgery.
   */
  async verifyGoogleIdToken(token: string) {
    try {
      const allowedAudiences = [
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_WEB_CLIENT_ID,
        process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        process.env.GOOGLE_ANDROID_CLIENT_ID,
        process.env.GOOGLE_IOS_CLIENT_ID,
      ].filter((aud): aud is string => Boolean(aud && aud.trim().length > 0));

      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: allowedAudiences.length > 0 ? allowedAudiences : undefined,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new UnauthorizedException('Chữ ký Google Token không hợp lệ');
      }

      return {
        sub: payload.sub,
        email: payload.email,
        displayName:
          payload.name || payload.given_name || payload.email.split('@')[0],
        avatarUrl: payload.picture,
      };
    } catch (verifyErr) {
      this.logger.warn(`Google verifyIdToken failed: ${verifyErr}`);
      throw new UnauthorizedException('Xác thực Google thất bại');
    }
  }

  /**
   * Decodes claims from a third-party Privy or general bearer credential.
   */
  async parsePrivyClaims(
    rawToken: string | undefined,
    normalizedProvider: string,
    dto: VerifyAuthDto,
  ): Promise<DecodedAuthPayload> {
    if (!rawToken) {
      throw new BadRequestException('Authentication token is required');
    }

    try {
      const { decode } = await import('jsonwebtoken');
      const unverified = decode(rawToken, { complete: true }) as {
        payload: {
          sub?: string;
          email?: string;
          name?: string;
          picture?: string;
          walletAddress?: string;
          wallet_address?: string;
          displayName?: string;
          avatarUrl?: string;
          iss?: string;
          privy?: unknown;
          wallet?: { address?: string };
          linked_accounts?: Array<{ type?: string; address?: string }>;
        };
      } | null;

      if (!unverified || !unverified.payload) {
        throw new UnauthorizedException('Malformed authentication token');
      }

      const payload = unverified.payload;
      const isPrivy =
        normalizedProvider === 'privy' ||
        Boolean(payload.iss && payload.iss.includes('privy.io')) ||
        Boolean(payload.privy);

      if (isPrivy) {
        return {
          sub: payload.sub,
          email:
            payload.email ||
            payload.linked_accounts?.find((a) => a.type === 'email')?.address,
          walletAddress:
            payload.wallet?.address ||
            payload.linked_accounts?.find((a) => a.type === 'wallet')
              ?.address ||
            dto.walletAddress,
          displayName: payload.name || dto.displayName,
          avatarUrl: payload.picture || dto.avatarUrl,
        };
      }

      return {
        sub: payload.sub,
        email: payload.email || dto.email,
        walletAddress:
          payload.walletAddress || payload.wallet_address || dto.walletAddress,
        displayName: payload.displayName || payload.name || dto.displayName,
        avatarUrl: payload.avatarUrl || payload.picture || dto.avatarUrl,
      };
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) throw error;
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Token parsing failed: ${message}`);
      throw new UnauthorizedException(
        'Invalid or expired authentication token',
      );
    }
  }
}
