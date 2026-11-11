import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, RoleType } from '../decorators/roles.decorator';
import { RequestUser } from '../decorators/current-user.decorator';

/**
 * Enterprise Role-Based Access Control (RBAC) Guard for NestJS.
 * Validates request.user against permitted roles declared on route handlers or controllers.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Route requires no specific role -> Allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as RequestUser | undefined;

    if (!user || !user.role) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn',
        error: 'Unauthorized',
      });
    }

    const normalizedRequiredRoles = requiredRoles.map((r) =>
      String(r).toUpperCase(),
    );
    const userRole = String(user.role).toUpperCase();

    // Match assigned role against permitted roles list
    const hasPermission = normalizedRequiredRoles.includes(userRole);

    if (!hasPermission) {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'Bạn không có quyền truy cập tài nguyên này',
        error: 'Forbidden',
      });
    }

    return true;
  }
}
