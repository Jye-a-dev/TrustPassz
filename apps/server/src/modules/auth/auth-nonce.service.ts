/**
 * auth-nonce.service.ts
 *
 * In-memory Nonce Manager with 5-minute TTL for Solana SIWS and Web3 auth (TASK-03 / TASK-14).
 * Enforces one-time consumption (anti-replay) and automatic periodic eviction.
 */

import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

interface NonceEntry {
  createdAt: number;
  expiresAt: number;
}

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class AuthNonceService {
  private readonly store = new Map<string, NonceEntry>();

  constructor() {
    // Periodic background cleanup for expired nonces
    setInterval(
      () => {
        const now = Date.now();
        for (const [key, entry] of this.store) {
          if (now > entry.expiresAt) {
            this.store.delete(key);
          }
        }
      },
      10 * 60 * 1000,
    ).unref();
  }

  /**
   * Generates a cryptographically secure random 16-byte hex nonce with 5-minute TTL.
   */
  generate(): string {
    const nonce = crypto.randomBytes(16).toString('hex');
    const now = Date.now();
    this.store.set(nonce, { createdAt: now, expiresAt: now + NONCE_TTL_MS });
    return nonce;
  }

  /**
   * Consumes a nonce atomically. Returns true if valid, false if expired or already consumed.
   */
  consume(nonce: string): boolean {
    const entry = this.store.get(nonce);
    if (!entry) return false;
    // Immediately delete to prevent replay attacks regardless of TTL
    this.store.delete(nonce);
    return Date.now() <= entry.expiresAt;
  }
}

// Module-level singleton instance for direct export compatibility
const globalNonceService = new AuthNonceService();
export function generateNonce(): string {
  return globalNonceService.generate();
}
export function consumeNonce(nonce: string): boolean {
  return globalNonceService.consume(nonce);
}
