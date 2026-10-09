import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthService, generateNonce } from './auth.service';
import { VerifyAuthDto } from './dto/verify-auth.dto';
import { Public } from '../../common/decorators/public.decorator';
import { THROTTLE_CONFIG } from '../../config/throttle.config';

// Cookie config — centralized for login and logout consistency
const ACCESS_TOKEN_COOKIE = 'access_token';
const isProd = process.env.NODE_ENV === 'production';
const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

const getCookieOptions = () => ({
  httpOnly: true,
  secure: isProd,
  sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
  path: '/',
  domain: cookieDomain,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
});

@ApiTags('Authentication (Passwordless & Web3)')
@Throttle({
  auth: { limit: THROTTLE_CONFIG.authLimit, ttl: THROTTLE_CONFIG.authTtlMs },
})
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Endpoint sinh Nonce cho SIWS (Sign-In With Solana).
   */
  @Public()
  @Get('nonce')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate one-time Nonce for SIWS',
    description:
      'Sinh chuỗi nonce ngẫu nhiên 32 hex chars với TTL 5 phút. Client nhúng vào message Solana trước khi ký để chống Replay Attack.',
  })
  @ApiResponse({
    status: 200,
    description: 'Nonce generated successfully.',
    schema: { example: { nonce: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4' } },
  })
  getNonce(): { nonce: string } {
    return { nonce: generateNonce() };
  }

  /**
   * verify() ghi JWT vào httpOnly cookie và trả về thông tin phiên.
   */
  @Public()
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    auth: { limit: THROTTLE_CONFIG.authLimit, ttl: THROTTLE_CONFIG.authTtlMs },
  })
  @ApiOperation({
    summary: 'Verify Google ID Token or Privy Passkey Token & Issue JWT Cookie',
    description:
      'Verifies the authenticity of OAuth tokens from Google or Privy Passkey, upserts the user record into Neon PostgreSQL, and sets an httpOnly cookie with the JWT.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful. JWT written to httpOnly cookie.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid token format, missing identity claims, or unsupported provider.',
  })
  @ApiResponse({
    status: 401,
    description: 'Signature verification failure or expired credentials.',
  })
  @ApiResponse({
    status: 429,
    description: 'Too Many Requests — Rate limit exceeded on auth endpoint.',
  })
  async verify(
    @Body() verifyAuthDto: VerifyAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyAuth(verifyAuthDto);

    // Ghi JWT vào httpOnly cookie và đồng thời trả accessToken trong response body
    res.cookie(ACCESS_TOKEN_COOKIE, result.accessToken, getCookieOptions());

    return result;
  }

  /**
   * Logout endpoint xóa httpOnly cookie với cùng path, sameSite và secure attributes.
   */
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout — clear auth cookie' })
  @ApiResponse({ status: 200, description: 'Logged out successfully.' })
  logout(@Res({ passthrough: true }) res: Response): { message: string } {
    const options = getCookieOptions();
    res.clearCookie(ACCESS_TOKEN_COOKIE, {
      httpOnly: options.httpOnly,
      secure: options.secure,
      sameSite: options.sameSite,
      path: options.path,
      domain: options.domain,
    });
    return { message: 'Đã đăng xuất thành công' };
  }
}
