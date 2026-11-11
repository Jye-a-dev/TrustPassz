import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user?: Record<string, unknown>): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  it('allows access if no @Roles() metadata is declared', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext({ id: '1', role: 'USER' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws 401 Unauthorized if user context is missing when roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('throws 403 Forbidden if user role does not match permitted roles', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN', 'ARBITRATOR']);
    const context = createMockContext({ id: '1', role: 'USER' });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('allows access when user has matching role', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN', 'ARBITRATOR']);
    const context = createMockContext({ id: '1', role: 'ADMIN' });

    expect(guard.canActivate(context)).toBe(true);
  });
});
