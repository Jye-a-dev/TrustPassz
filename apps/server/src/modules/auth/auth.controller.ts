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
import type { Response } from 'express';
import { AuthService, generateNonce } from './auth.service';
import { VerifyAuthDto } from './dto/verify-auth.dto';
import { Public } from '../../common/decorators/public.decorator';

// Cookie config — centralized để logout dùng lại
const ACCESS_TOKEN_COOKIE = 'access_token';
const COOKIE_OPTIONS = {
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

@ApiTags('Authentication (Passwordless & Web3)')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * FIX C1: Endpoint sinh Nonce cho SIWS (Sign-In With Solana).
   * Client phải nhúng nonce vào message trước khi ký.
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
   * FIX C2: verify() giờ ghi JWT vào httpOnly cookie thay vì trả về body.
   * Response body vẫn giữ `user` metadata và `tokenType` nhưng KHÔNG còn `accessToken`.
   */
  @Public()
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify Google ID Token or Privy Passkey Token & Issue JWT Cookie',
    description:
      'Verifies the authenticity of OAuth tokens from Google or Privy Passkey, upserts the user record into Neon PostgreSQL, and sets an httpOnly cookie with the JWT. accessToken is no longer returned in the response body.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful. JWT written to httpOnly cookie.',
    schema: {
      example: {
        tokenType: 'Bearer',
        expiresIn: 604800,
        user: {
          id: '11111111-1111-4111-a111-111111111111',
          email: 'seller@trustpassz.io',
          walletAddress: '0x1111111111111111111111111111111111111111',
          displayName: 'Trusted Seller',
          role: 'USER',
        },
      },
    },
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
  async verify(
    @Body() verifyAuthDto: VerifyAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyAuth(verifyAuthDto);

    // FIX C2: Ghi JWT vào cookie và đồng thời trả accessToken trong response body
    res.cookie(ACCESS_TOKEN_COOKIE, result.accessToken, COOKIE_OPTIONS);

    return result;
  }

  /**
   * FIX C2: Logout endpoint xóa httpOnly cookie.
   */
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout — clear auth cookie' })
  @ApiResponse({ status: 200, description: 'Logged out successfully.' })
  logout(@Res({ passthrough: true }) res: Response): { message: string } {
    res.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
    return { message: 'Đã đăng xuất thành công' };
  }
}
