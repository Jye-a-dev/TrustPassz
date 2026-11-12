import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { JwtService } from '../../modules/auth/jwt.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RequestUser } from '../decorators/current-user.decorator';

export interface JwtTokenPayload {
  sub?: string;
  id?: string;
  email?: string | null;
  wallet_address?: string | null;
  walletAddress?: string | null;
  role?: string;
  [key: string]: unknown;
}

/**
 * Enterprise Zero-Trust JWT Authentication Guard for NestJS.
 * Features Dual-Token Extraction (Cookie priority with Authorization header fallback),
 * cryptographic signature & expiration verification via JwtService, and RequestUser injection.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    protected readonly jwtService: JwtService,
    protected readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token =
      this.extractTokenFromCookie(request) ||
      this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn',
        error: 'Unauthorized',
      });
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtTokenPayload>(
        token,
        process.env.JWT_SECRET
          ? ({ secret: process.env.JWT_SECRET } as unknown as object)
          : undefined,
      );

      const userId = payload.sub || payload.id;
      if (!userId) {
        throw new UnauthorizedException({
          statusCode: 401,
          message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn',
          error: 'Unauthorized',
        });
      }

      // Inject normalized identity context into request.user
      const user: RequestUser = {
        id: userId,
        email: payload.email ?? null,
        walletAddress: payload.wallet_address ?? payload.walletAddress ?? null,
        role: payload.role ?? 'USER',
      };

      (request as unknown as { user: RequestUser }).user = user;
    } catch {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn',
        error: 'Unauthorized',
      });
    }

    return true;
  }

  /**
   * Dual-Token Priority 1: Read access_token from unsigned or signed cookies
   */
  protected extractTokenFromCookie(request: Request): string | undefined {
    const cookies = request.cookies as Record<string, string> | undefined;
    const signedCookies = request.signedCookies as
      Record<string, string> | undefined;
    const token = cookies?.['access_token'] || signedCookies?.['access_token'];
    return token ? token.trim() : undefined;
  }

  /**
   * Dual-Token Fallback 2: Read Bearer <token> from Authorization header
   */
  protected extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' && token ? token.trim() : undefined;
  }
}
