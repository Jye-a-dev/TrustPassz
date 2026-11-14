import {
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtService implements OnModuleInit {
  private secret: string;
  private readonly expiresIn: string = '7d';

  constructor() {
    const isProd = process.env.NODE_ENV === 'production';
    const envSecret = process.env.JWT_SECRET?.trim();

    if (isProd) {
      if (!envSecret || envSecret.length < 32) {
        throw new InternalServerErrorException(
          'FATAL: JWT_SECRET must be configured and at least 32 characters in production',
        );
      }
      this.secret = envSecret;
    } else {
      // Ephemeral in-memory random secret for development & testing only
      this.secret =
        envSecret && envSecret.length >= 32
          ? envSecret
          : crypto.randomBytes(32).toString('hex');
    }
  }

  onModuleInit(): void {
    const isProd = process.env.NODE_ENV === 'production';
    const envSecret = process.env.JWT_SECRET?.trim();

    if (isProd) {
      if (!envSecret || envSecret.length < 32) {
        throw new InternalServerErrorException(
          'FATAL: JWT_SECRET must be configured and at least 32 characters in production',
        );
      }
      this.secret = envSecret;
    }
  }

  signAsync(
    payload: string | object | Buffer,
    options?: jwt.SignOptions,
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      jwt.sign(
        payload,
        this.secret,
        {
          expiresIn: this.expiresIn,
          ...options,
        } as jwt.SignOptions,
        (err, encoded) => {
          if (err || !encoded) {
            return reject(err ?? new Error('JWT signing failed'));
          }
          resolve(encoded);
        },
      );
    });
  }

  verifyAsync<T extends object = Record<string, unknown>>(
    token: string,
    options?: jwt.VerifyOptions,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      jwt.verify(token, this.secret, options, (err, decoded) => {
        if (err || !decoded) {
          return reject(err ?? new Error('JWT verification failed'));
        }
        resolve(decoded as T);
      });
    });
  }

  decode(token: string, options?: jwt.DecodeOptions): unknown {
    return jwt.decode(token, options);
  }
}
