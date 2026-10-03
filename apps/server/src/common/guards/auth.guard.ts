import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { JwtService } from '../../modules/auth/jwt.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RequestUser } from '../decorators/current-user.decorator';

interface JwtTokenPayload {
  sub?: string;
  id?: string;
  email?: string | null;
  wallet_address?: string | null;
  walletAddress?: string | null;
  role?: string;
  [key: string]: unknown;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
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
      throw new UnauthorizedException('Authentication token is required');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtTokenPayload>(token);

      const userId = payload.sub || payload.id;
      if (!userId) {
        throw new UnauthorizedException(
          'Token payload is invalid: missing subject identifier',
        );
      }

      // Context Injection: normalize claims into standardized RequestUser
      const user: RequestUser = {
        id: userId,
        email: payload.email ?? null,
        walletAddress: payload.wallet_address ?? payload.walletAddress ?? null,
        role: payload.role ?? 'USER',
      };

      request['user'] = user;
    } catch (error: unknown) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException(
          'Phiên xác thực đã hết hạn, vui lòng đăng nhập lại',
        );
      }
      if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException(
          `Token xác thực không hợp lệ: ${error.message}`,
        );
      }
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(
        'Không thể xác thực danh tính người dùng',
      );
    }

    return true;
  }

  /**
   * Safe extraction: First check unsigned cookies, fallback to signed cookies
   */
  private extractTokenFromCookie(request: Request): string | undefined {
    const cookies = request.cookies as Record<string, string> | undefined;
    const signedCookies = request.signedCookies as
      | Record<string, string>
      | undefined;
    return (
      cookies?.['access_token'] || signedCookies?.['access_token'] || undefined
    );
  }

  /**
   * Fallback extraction: Standard Bearer token in Authorization header
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' && token ? token.trim() : undefined;
  }
}
