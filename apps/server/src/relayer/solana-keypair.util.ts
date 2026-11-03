/**
 * solana-keypair.util.ts
 *
 * Utility functions for Solana Keypair derivation, parsing, and address resolution.
 * Supports Base58 (Solflare/Phantom private key exports) and JSON byte arrays ([1, 2, ...]).
 * Safe for runtime monitoring and balance checking even when the private key is not configured.
 */

import { Keypair, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';

export const DEFAULT_SOLANA_RELAYER_PUBLIC_KEY =
  'F9zXgYmojDjHnjiRCtNLb46ruUorjrWeEDBxF2dFkJjn';

/**
 * Parses a Solana private key from a string.
 * Supports:
 * 1. JSON Array string: "[1, 2, 3, ...]" (Solana CLI / id.json)
 * 2. Base58 encoded string: "5M4..." (Solflare / Phantom export)
 *
 * Returns null if secret is empty, missing, or malformed.
 */
export function parseSolanaKeypair(secret?: string): Keypair | null {
  if (!secret || secret.trim().length === 0) {
    return null;
  }

  const trimmed = secret.trim();

  // 1. Check for JSON array of byte integers
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && (parsed.length === 64 || parsed.length === 32)) {
        const bytes = Uint8Array.from(parsed);
        if (bytes.length === 64) {
          return Keypair.fromSecretKey(bytes);
        }
        if (bytes.length === 32) {
          return Keypair.fromSeed(bytes);
        }
      }
    } catch {
      // Continue to Base58 fallback
    }
  }

  // 2. Check for Base58 private key string
  try {
    const decoded = bs58.decode(trimmed);
    if (decoded.length === 64) {
      return Keypair.fromSecretKey(decoded);
    }
    if (decoded.length === 32) {
      return Keypair.fromSeed(decoded);
    }
  } catch {
    // Decoding failed
  }

  return null;
}

/**
 * Resolves a valid Solana PublicKey for the Relayer authority.
 * Priority:
 * 1. Keypair's public key (if keypair exists)
 * 2. Explicit public key from configuration / environment
 * 3. Default Solflare Devnet Relayer Public Key (F9zXgYmojDjHnjiRCtNLb46ruUorjrWeEDBxF2dFkJjn)
 */
export function resolveSolanaRelayerPublicKey(
  explicitPublicKey?: string,
  keypair?: Keypair | null,
): PublicKey {
  if (keypair) {
    return keypair.publicKey;
  }

  const candidate = explicitPublicKey?.trim();
  if (candidate && candidate.length > 0) {
    try {
      return new PublicKey(candidate);
    } catch {
      // Invalid candidate, use default
    }
  }

  return new PublicKey(DEFAULT_SOLANA_RELAYER_PUBLIC_KEY);
}

