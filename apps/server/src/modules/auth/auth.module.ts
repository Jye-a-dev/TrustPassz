import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from './jwt.service';
import { AuthNonceService } from './auth-nonce.service';
import { AuthVerifierService } from './auth-verifier.service';

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [AuthService, JwtService, AuthNonceService, AuthVerifierService],
  exports: [AuthService, JwtService, AuthNonceService, AuthVerifierService],
})
export class AuthModule {}
