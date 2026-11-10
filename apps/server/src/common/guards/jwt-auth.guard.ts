import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '../../modules/auth/jwt.service';
import { AuthGuard } from './auth.guard';

/**
 * Semantic alias of AuthGuard for JWT-authenticated mobile & API endpoints.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard {
  constructor(jwtService: JwtService, reflector: Reflector) {
    super(jwtService, reflector);
  }
}
