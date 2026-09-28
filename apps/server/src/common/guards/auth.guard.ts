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
    // FIX C2: Ưu tiên httpOnly cookie, fallback về Authorization header (cho API clients độc lập)
    const token =
      this.extractTokenFromCookie(request) ||
      this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Authentication token is required');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired authentication token',
      );
    }

    return true;
  }

  /** FIX C2: Đọc JWT từ httpOnly cookie `access_token` */
  private extractTokenFromCookie(request: Request): string | undefined {
    // req.cookies được populate bởi cookie-parser middleware (đăng ký trong main.ts)
    const cookies = request.cookies as Record<string, string> | undefined;
    return cookies?.['access_token'] || undefined;
  }

  /** Fallback: đọc Bearer token từ Authorization header (Postman / mobile clients) */
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
