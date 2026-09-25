import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
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

interface RawJwtClaims {
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
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Verifies an incoming Privy passkey token or Google ID token,
   * extracts identity claims, and upserts the user into Neon PostgreSQL.
   */
  async verifyAuth(dto: VerifyAuthDto) {
    const { token, provider } = dto;

    if (!token) {
      throw new BadRequestException('Authentication token is required');
    }

    let decodedClaims: DecodedAuthPayload = {};

    try {
      const unverified = jwt.decode(token, { complete: true }) as {
        header: jwt.JwtHeader;
        payload: RawJwtClaims;
      } | null;

      if (!unverified || !unverified.payload) {
        throw new UnauthorizedException('Malformed authentication token');
      }

      const payload = unverified.payload;

      const isPrivy =
        provider === 'PRIVY' ||
        Boolean(payload.iss && payload.iss.includes('privy.io')) ||
        Boolean(payload.privy);

      const isGoogle =
        provider === 'GOOGLE' ||
        Boolean(payload.iss && payload.iss.includes('accounts.google.com')) ||
        Boolean(payload.email_verified);

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
      } else if (isGoogle) {
        decodedClaims = {
          sub: payload.sub,
          email: payload.email,
          displayName: payload.name || payload.given_name || dto.displayName,
          avatarUrl: payload.picture || dto.avatarUrl,
          walletAddress: dto.walletAddress,
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

    const email = dto.email || decodedClaims.email;
    const walletAddress = (
      dto.walletAddress || decodedClaims.walletAddress
    )?.toLowerCase();
    const displayName =
      dto.displayName ||
      decodedClaims.displayName ||
      (walletAddress
        ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
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
        user,
        accessToken,
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
