import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtService } from '../../modules/auth/jwt.service';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: jest.Mocked<JwtService>;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test_jwt_secret_key_2026';
    jwtService = {
      verifyAsync: jest.fn(),
      signAsync: jest.fn(),
      decode: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new JwtAuthGuard(jwtService, reflector);
  });

  const createMockContext = (req: Record<string, unknown>): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: jest.fn(),
      }),
    }) as unknown as ExecutionContext;

  it('allows public routes marked with @Public() without tokens', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const context = createMockContext({ headers: {}, cookies: {} });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('throws 401 Unauthorized when neither cookie nor Authorization header is present', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const context = createMockContext({ headers: {}, cookies: {} });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('extracts token from cookie (Priority 1) and injects request.user', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const req = {
      cookies: { access_token: 'valid.cookie.token' },
      headers: {},
    };
    const context = createMockContext(req);

    jwtService.verifyAsync.mockResolvedValueOnce({
      sub: 'usr_123',
      email: 'user@trustpassz.io',
      wallet_address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      role: 'USER',
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith(
      'valid.cookie.token',
      expect.anything(),
    );
    expect(req['user']).toEqual({
      id: 'usr_123',
      email: 'user@trustpassz.io',
      walletAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      role: 'USER',
    });
  });

  it('extracts token from Authorization Bearer header (Fallback 2)', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const req = {
      cookies: {},
      headers: { authorization: 'Bearer header.jwt.token' },
    };
    const context = createMockContext(req);

    jwtService.verifyAsync.mockResolvedValueOnce({
      id: 'usr_456',
      email: 'admin@trustpassz.io',
      walletAddress: '9yABC...',
      role: 'ADMIN',
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith(
      'header.jwt.token',
      expect.anything(),
    );
    expect(req['user']).toEqual({
      id: 'usr_456',
      email: 'admin@trustpassz.io',
      walletAddress: '9yABC...',
      role: 'ADMIN',
    });
  });

  it('throws 401 when token verification fails or token is corrupt', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const req = {
      cookies: {},
      headers: { authorization: 'Bearer invalid.token' },
    };
    const context = createMockContext(req);

    jwtService.verifyAsync.mockRejectedValueOnce(new Error('Invalid token'));

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
