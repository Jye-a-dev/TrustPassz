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

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no role restriction is declared, route is accessible to any valid session
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as RequestUser | undefined;

    if (!user || !user.role) {
      throw new UnauthorizedException(
        'Yêu cầu xác thực danh tính trước khi kiểm tra quyền hạn',
      );
    }

    const normalizedRequiredRoles = requiredRoles.map((r) =>
      String(r).toUpperCase(),
    );
    const userRole = String(user.role).toUpperCase();

    // Match assigned role against permitted roles list
    const hasPermission = normalizedRequiredRoles.includes(userRole);

    if (!hasPermission) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập tài nguyên này',
      );
    }

    return true;
  }
}
