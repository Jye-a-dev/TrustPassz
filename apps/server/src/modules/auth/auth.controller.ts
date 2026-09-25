import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { VerifyAuthDto } from './dto/verify-auth.dto';

@ApiTags('Authentication (Passwordless & Web3)')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify Google ID Token or Privy Passkey Token & Issue JWT',
    description:
      'Verifies the authenticity of OAuth tokens from Google or Privy Passkey, upserts the user record into Neon PostgreSQL, and returns an application JWT bearer token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful. Returns JWT Bearer token.',
    schema: {
      example: {
        accessToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMTExMTExMS0xMTExLTQxMTEtYTExMS0xMTExMTExMTExMTEiLCJlbWFpbCI6InNlbGxlckB0cnVzdHBhc3N6LmlvIiwicm9sZSI6IlVTRVIiLCJpYXQiOjE3Mjc0MDAwMDAsImV4cCI6MTcyODAwNDgwMH0.sample_signature',
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
    schema: {
      example: {
        statusCode: 400,
        message: 'Invalid Google token payload',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Signature verification failure or expired credentials.',
  })
  async verify(@Body() verifyAuthDto: VerifyAuthDto) {
    return this.authService.verifyAuth(verifyAuthDto);
  }
}
