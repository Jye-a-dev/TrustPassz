import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtService {
  private readonly secret: string;
  private readonly expiresIn: string;

  constructor() {
    this.secret =
      process.env.JWT_SECRET || 'trustpassz_jwt_super_secret_key_2026';
    this.expiresIn = '7d';
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
