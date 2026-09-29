/**
 * Lightweight, zero-dependency JWT decoder compatible with Next.js Edge Runtime.
 * Decodes base64url payloads with full UTF-8 byte boundary safety and validates standard expiration claims.
 */

export interface EdgeJwtPayload {
  sub?: string;
  id?: string;
  email?: string | null;
  walletAddress?: string | null;
  wallet_address?: string | null;
  role?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

export interface EdgeTokenValidationResult {
  valid: boolean;
  expired: boolean;
  payload: EdgeJwtPayload | null;
}

/**
 * Decodes base64url encoded string safely inside Edge environments without Buffer or external dependencies.
 */
export function decodeBase64Url(input: string): string {
  if (!input) return '';
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  try {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return '';
  }
}

/**
 * Parses and returns the JSON payload object from the base64-url segment of a JWT.
 * Compatible with Edge Runtime and Browser without external libraries.
 */
export function parseJwtPayload<T = EdgeJwtPayload>(token: string): T | null {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const segments = token.split('.');
  if (segments.length !== 3) {
    return null;
  }

  try {
    const jsonStr = decodeBase64Url(segments[1]);
    if (!jsonStr) {
      return null;
    }
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}

/** Backward compatibility alias */
export const decodeJwtPayload = parseJwtPayload;

/**
 * Validates expiration claim with a buffer window.
 * Returns true if expired, invalid, or within buffer window (Date.now() >= exp * 1000 - bufferSeconds * 1000).
 */
export function isTokenExpired(tokenOrExp?: string | number, bufferSeconds = 15): boolean {
  if (tokenOrExp === undefined || tokenOrExp === null || tokenOrExp === '') {
    return true;
  }

  let exp: number | undefined;

  if (typeof tokenOrExp === 'number') {
    exp = tokenOrExp;
  } else if (typeof tokenOrExp === 'string') {
    const payload = parseJwtPayload<EdgeJwtPayload>(tokenOrExp);
    if (!payload) {
      return true;
    }
    if (payload.exp !== undefined && payload.exp !== null) {
      exp = typeof payload.exp === 'number' ? payload.exp : Number(payload.exp);
    } else if (payload.iat !== undefined && payload.iat !== null) {
      // Default to 7 days if exp is missing but iat is present
      const iat = typeof payload.iat === 'number' ? payload.iat : Number(payload.iat);
      exp = iat + 7 * 86400;
    } else {
      return true;
    }
  }

  if (typeof exp !== 'number' || isNaN(exp)) {
    return true;
  }

  return Date.now() >= (exp * 1000) - (bufferSeconds * 1000);
}

/**
 * Performs edge-level structural and expiry validation on JWT strings.
 */
export function validateEdgeToken(token: string): EdgeTokenValidationResult {
  const payload = parseJwtPayload<EdgeJwtPayload>(token);
  if (!payload) {
    return { valid: false, expired: true, payload: null };
  }

  const expired = isTokenExpired(payload.exp, 15);
  return {
    valid: !expired,
    expired,
    payload,
  };
}
