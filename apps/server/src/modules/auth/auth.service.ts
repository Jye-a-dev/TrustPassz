import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { VerifyAuthDto } from './dto/verify-auth.dto';
import { JwtService } from './jwt.service';
import {
  AuthNonceService,
  generateNonce,
  consumeNonce,
} from './auth-nonce.service';
import {
  AuthVerifierService,
  DecodedAuthPayload,
} from './auth-verifier.service';

export { generateNonce, consumeNonce, type DecodedAuthPayload };

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly nonceService: AuthNonceService,
    private readonly verifierService: AuthVerifierService,
  ) {}

  /**
   * Verifies an incoming auth credential (Password, Google, Privy, or Solana),
   * extracts identity claims, and upserts the user into Neon PostgreSQL.
   */
  async verifyAuth(dto: VerifyAuthDto) {
    // 0. Email & Password Authentication
    if (dto.password && dto.email) {
      return this.handleEmailPasswordAuth(dto);
    }

    const rawToken = dto.idToken || dto.token;
    const { provider, solanaPublicKey, solanaSignature, solanaMessage } = dto;
    const normalizedProvider = provider?.toLowerCase() || '';

    let decodedClaims: DecodedAuthPayload = {};

    // 1. Solana Authentication (Ed25519 Detached Verify with Nonce Anti-Replay)
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

      // Nonce extraction & one-time consumption check
      const nonceMatch = message.match(/[Nn]once:\s*([a-f0-9]{32})/);
      if (!nonceMatch) {
        throw new UnauthorizedException(
          'Solana message thiếu trường Nonce. Hãy lấy nonce mới từ /api/v1/auth/nonce',
        );
      }
      const nonce = nonceMatch[1];
      if (!this.nonceService.consume(nonce)) {
        throw new UnauthorizedException('Nonce không hợp lệ hoặc đã hết hạn');
      }

      const isValid = this.verifierService.verifySolanaSignature(
        message,
        signature,
        pubkey,
      );
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
    // 2. Google OAuth Authentication (Official verifyIdToken)
    else if (normalizedProvider === 'google') {
      if (!rawToken) {
        throw new BadRequestException('Google ID token is required');
      }
      const googleClaims =
        await this.verifierService.verifyGoogleIdToken(rawToken);
      decodedClaims = {
        sub: googleClaims.sub,
        email: googleClaims.email || dto.email,
        displayName: googleClaims.displayName || dto.displayName,
        avatarUrl: googleClaims.avatarUrl || dto.avatarUrl,
        walletAddress: dto.walletAddress,
      };
    }
    // 3. Privy JWT Token parsing
    else {
      decodedClaims = await this.verifierService.parsePrivyClaims(
        rawToken,
        normalizedProvider,
        dto,
      );
    }

    return this.upsertUserAndCreateSession(
      decodedClaims,
      dto,
      normalizedProvider,
    );
  }

  /**
   * Handles local password registration and credential verification.
   */
  private async handleEmailPasswordAuth(dto: VerifyAuthDto) {
    const email = dto.email!.trim().toLowerCase();
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
      },
    });

    if (!existingUser) {
      if (dto.displayName) {
        // Registration flow: hash password then create user
        const hashedPassword = await bcrypt.hash(dto.password!, 12);
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
      dto.password!,
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

  /**
   * Persists or synchronizes profile in PostgreSQL and issues platform session JWT.
   */
  private async upsertUserAndCreateSession(
    decodedClaims: DecodedAuthPayload,
    dto: VerifyAuthDto,
    normalizedProvider: string,
  ) {
    const rawEmail = dto.email || decodedClaims.email;
    const email = rawEmail ? rawEmail.trim().toLowerCase() : undefined;
    const isSolana =
      normalizedProvider === 'solana' || Boolean(dto.solanaPublicKey);
    const rawWallet =
      dto.solanaPublicKey || dto.walletAddress || decodedClaims.walletAddress;

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

  async validateUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }
}
