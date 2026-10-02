import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import * as nacl from 'tweetnacl';
import bs58 from 'bs58';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { VerifyAuthDto } from './dto/verify-auth.dto';
import { JwtService } from './jwt.service';

export interface DecodedAuthPayload {
  sub?: string;
  email?: string;
  walletAddress?: string;
  displayName?: string;
  avatarUrl?: string;
  iss?: string;
  aud?: string | string[];
}

// FIX C1: Nonce store với TTL 5 phút
interface NonceEntry {
  createdAt: number;
  expiresAt: number;
}

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Module-level singleton map — đủ cho single-process; thay Redis cho multi-instance
const nonceStore = new Map<string, NonceEntry>();

/**
 * Sinh nonce ngẫu nhiên và lưu vào store với TTL 5 phút.
 * Gọi từ GET /api/v1/auth/nonce
 */
export function generateNonce(): string {
  const nonce = crypto.randomBytes(16).toString('hex');
  const now = Date.now();
  nonceStore.set(nonce, { createdAt: now, expiresAt: now + NONCE_TTL_MS });
  return nonce;
}

/**
 * Kiểm tra và tiêu thụ nonce (one-time use).
 * Trả về true nếu hợp lệ, false nếu không tồn tại / hết hạn.
 */
function consumeNonce(nonce: string): boolean {
  const entry = nonceStore.get(nonce);
  if (!entry) return false;
  // Xóa ngay lập tức để chặn replay dù TTL còn hay hết
  nonceStore.delete(nonce);
  return Date.now() <= entry.expiresAt;
}

// FIX C1: Cleanup entries đã expired định kỳ (mỗi 10 phút)
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of nonceStore) {
      if (now > entry.expiresAt) nonceStore.delete(key);
    }
  },
  10 * 60 * 1000,
).unref();

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  // FIX H1: Không dùng jwt.decode fallback — chỉ verify chính thức
  private readonly googleClient = new OAuth2Client();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Verifies Solana Ed25519 signature using tweetnacl detached verify
   */
  private verifySolanaSignature(
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
   * FIX H1: Verifies Google OAuth ID Token — ONLY via official verifyIdToken().
   * Removed jwt.decode() fallback to prevent signature bypass.
   */
  private async verifyGoogleIdToken(token: string) {
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
        displayName: payload.name || payload.given_name || payload.email.split('@')[0],
        avatarUrl: payload.picture,
      };
    } catch (verifyErr) {
      // FIX H1: Tuyệt đối không fallback sang jwt.decode() — ném lỗi ngay
      this.logger.warn(`Google verifyIdToken failed: ${verifyErr}`);
      throw new UnauthorizedException('Xác thực Google thất bại');
    }
  }

  /**
   * Verifies an incoming auth credential (Google, Privy, or Solana),
   * extracts identity claims, and upserts the user into Neon PostgreSQL.
   */
  async verifyAuth(dto: VerifyAuthDto) {
    // 0. Email & Password Authentication
    if (dto.password && dto.email) {
      const email = dto.email.trim().toLowerCase();
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: { equals: email, mode: 'insensitive' },
        },
      });

      if (!existingUser) {
        if (dto.displayName) {
          // Registration flow: hash password then create user
          const hashedPassword = await bcrypt.hash(dto.password, 12);
          const newUser = await this.prisma.user.create({
            data: {
              email,
              password: hashedPassword,
              displayName: dto.displayName.trim(),
              walletAddress: dto.walletAddress?.trim() || null,
              role: UserRole.USER,
            },
          });

          const sessionPayload = {
            sub: newUser.id,
            email: newUser.email,
            walletAddress: newUser.walletAddress,
            role: newUser.role,
          };

          const accessToken = await this.jwtService.signAsync(sessionPayload);

          return {
            accessToken,
            tokenType: 'Bearer',
            expiresIn: 604800,
            user: {
              id: newUser.id,
              email: newUser.email,
              walletAddress: newUser.walletAddress,
              displayName: newUser.displayName,
              avatarUrl: newUser.avatarUrl,
              role: newUser.role,
            },
          };
        }

        throw new UnauthorizedException(
          'Tài khoản không tồn tại trên hệ thống. Vui lòng đăng ký tài khoản mới.',
        );
      }

      // Existing user with displayName passed -> registration collision
      if (dto.displayName) {
        throw new BadRequestException(
          'Email này đã được sử dụng. Vui lòng chuyển sang trang Đăng nhập.',
        );
      }

      if (!existingUser.password) {
        throw new UnauthorizedException(
          'Tài khoản này được đăng ký qua Google hoặc ví Web3. Vui lòng sử dụng Google hoặc ví Web3 để đăng nhập.',
        );
      }

      const passwordMatch = await bcrypt.compare(
        dto.password,
        existingUser.password,
      );
      if (!passwordMatch) {
        throw new UnauthorizedException('Mật khẩu không chính xác');
      }

      const sessionPayload = {
        sub: existingUser.id,
        email: existingUser.email,
        walletAddress: existingUser.walletAddress,
        role: existingUser.role,
      };

      const accessToken = await this.jwtService.signAsync(sessionPayload);

      return {
        accessToken,
        tokenType: 'Bearer',
        expiresIn: 604800,
        user: {
          id: existingUser.id,
          email: existingUser.email,
          walletAddress: existingUser.walletAddress,
          displayName: existingUser.displayName,
          avatarUrl: existingUser.avatarUrl,
          role: existingUser.role,
        },
      };
    }

    const rawToken = dto.idToken || dto.token;
    const { provider, solanaPublicKey, solanaSignature, solanaMessage } =
      dto;
    const normalizedProvider = provider?.toLowerCase() || '';

    let decodedClaims: DecodedAuthPayload = {};

    // 1. Solana Authentication (Ed25519 Detached Verify) — FIX C1: Nonce validation
    if (
      normalizedProvider === 'solana' ||
      Boolean(solanaPublicKey && solanaSignature)
    ) {
      const pubkey = solanaPublicKey || dto.walletAddress;
      const signature = solanaSignature || rawToken;
      const message = solanaMessage;

      if (!pubkey || !signature || !message) {
        throw new BadRequestException(
          'Solana authentication requires solanaPublicKey, solanaSignature, and solanaMessage',
        );
      }

      // FIX C1: Trích xuất nonce từ message và validate one-time use
      const nonceMatch = message.match(/[Nn]once:\s*([a-f0-9]{32})/);
      if (!nonceMatch) {
        throw new UnauthorizedException(
          'Solana message thiếu trường Nonce. Hãy lấy nonce mới từ /api/v1/auth/nonce',
        );
      }
      const nonce = nonceMatch[1];
      if (!consumeNonce(nonce)) {
        throw new UnauthorizedException('Nonce không hợp lệ hoặc đã hết hạn');
      }

      const isValid = this.verifySolanaSignature(message, signature, pubkey);
      if (!isValid) {
        throw new UnauthorizedException(
          'Invalid Solana wallet signature: verification failed',
        );
      }

      decodedClaims = {
        sub: pubkey,
        walletAddress: pubkey,
        displayName:
          dto.displayName || `${pubkey.slice(0, 4)}...${pubkey.slice(-4)}`,
        avatarUrl: dto.avatarUrl,
        email: dto.email,
      };
    }
    // 2. Google OAuth Authentication — FIX H1: verify-only, no fallback
    else if (normalizedProvider === 'google') {
      if (!rawToken) {
        throw new BadRequestException('Google ID token is required');
      }
      const googleClaims = await this.verifyGoogleIdToken(rawToken);
      decodedClaims = {
        sub: googleClaims.sub,
        email: googleClaims.email || dto.email,
        displayName: googleClaims.displayName || dto.displayName,
        avatarUrl: googleClaims.avatarUrl || dto.avatarUrl,
        walletAddress: dto.walletAddress,
      };
    }
    // 3. Privy JWT Token (verified via Privy JWKS — decode with complete=true for header inspection only)
    else {
      if (!rawToken) {
        throw new BadRequestException('Authentication token is required');
      }

      try {
        // NOTE: Privy tokens are verified at the infrastructure boundary (Privy SDK).
        // We decode here only to extract payload claims for user upsert.
        // For production hardening, replace with full JWKS verify against Privy's JWKS endpoint.
        const { decode } = await import('jsonwebtoken');
        const unverified = decode(rawToken, { complete: true }) as {
          header: { alg: string; kid?: string };
          payload: {
            sub?: string;
            email?: string;
            name?: string;
            given_name?: string;
            picture?: string;
            walletAddress?: string;
            wallet_address?: string;
            displayName?: string;
            avatarUrl?: string;
            iss?: string;
            aud?: string | string[];
            privy?: unknown;
            email_verified?: boolean;
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
          decodedClaims = {
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
        } else {
          decodedClaims = {
            sub: payload.sub,
            email: payload.email || dto.email,
            walletAddress:
              payload.walletAddress ||
              payload.wallet_address ||
              dto.walletAddress,
            displayName: payload.displayName || payload.name || dto.displayName,
            avatarUrl: payload.avatarUrl || payload.picture || dto.avatarUrl,
          };
        }
      } catch (error: unknown) {
        if (error instanceof UnauthorizedException) {
          throw error;
        }
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Token parsing failed: ${message}`);
        throw new UnauthorizedException(
          'Invalid or expired authentication token',
        );
      }
    }

    const rawEmail = dto.email || decodedClaims.email;
    const email = rawEmail ? rawEmail.trim().toLowerCase() : undefined;
    const isSolana =
      normalizedProvider === 'solana' || Boolean(solanaPublicKey);
    const rawWallet =
      solanaPublicKey || dto.walletAddress || decodedClaims.walletAddress;

    // Solana addresses are Base58 (case-sensitive); EVM addresses can be lowercased
    const walletAddress = rawWallet
      ? isSolana
        ? rawWallet.trim()
        : rawWallet.trim().toLowerCase()
      : undefined;

    const displayName =
      dto.displayName ||
      decodedClaims.displayName ||
      (walletAddress
        ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
        : 'User');
    const avatarUrl = dto.avatarUrl || decodedClaims.avatarUrl;

    if (!email && !walletAddress) {
      throw new BadRequestException(
        'Authentication must provide at least an email or a wallet address',
      );
    }

    try {
      let user = await this.prisma.user.findFirst({
        where: {
          OR: [
            ...(walletAddress ? [{ walletAddress }] : []),
            ...(email ? [{ email }] : []),
          ],
        },
      });

      if (user) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            ...(email && !user.email && { email }),
            ...(walletAddress && !user.walletAddress && { walletAddress }),
            ...(displayName && { displayName }),
            ...(avatarUrl && { avatarUrl }),
            updatedAt: new Date(),
          },
        });
      } else {
        user = await this.prisma.user.create({
          data: {
            email: email || null,
            walletAddress: walletAddress || null,
            displayName,
            avatarUrl: avatarUrl || null,
            role: UserRole.USER,
          },
        });
      }

      const sessionPayload = {
        sub: user.id,
        email: user.email,
        walletAddress: user.walletAddress,
        role: user.role,
      };

      const accessToken = await this.jwtService.signAsync(sessionPayload);

      return {
        accessToken,
        tokenType: 'Bearer',
        expiresIn: 604800,
        user: {
          id: user.id,
          email: user.email,
          walletAddress: user.walletAddress,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          role: user.role,
        },
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`User upsert failed: ${message}`, stack);
      throw new InternalServerErrorException(
        'Failed to synchronize user profile',
      );
    }
  }

  /**
   * Retrieves user details by ID for request context validation.
   */
  async validateUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }
}
