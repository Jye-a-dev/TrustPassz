import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '../../modules/auth/jwt.service';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * Backward-compatible alias for JwtAuthGuard across controller endpoints.
 */
@Injectable()
export class AuthGuard extends JwtAuthGuard {
  constructor(jwtService: JwtService, reflector: Reflector) {
    super(jwtService, reflector);
  }
}
