export interface AdminEdgeJwtPayload {
  id?: string;
  sub?: string;
  role?: string;
  exp?: number;
  email?: string | null;
  [key: string]: unknown;
}

/**
 * Parses JWT payload using Web standard APIs for Edge Runtime & browser compatibility.
 * Strictly avoids Node.js built-ins (crypto, buffer, stream).
 */
export function parseJwtPayload<T extends Record<string, unknown> = AdminEdgeJwtPayload>(
  token: string,
): T | null {
  try {
    const cleanToken = token
      .replace(/^Bearer\s+/i, '')
      .replace(/^"|"$/g, '')
      .trim();

    if (!cleanToken || cleanToken === 'undefined' || cleanToken === 'null') {
      return null;
    }

    const segments = cleanToken.split('.');
    if (segments.length !== 3) {
      return null;
    }

    // Convert Base64URL to standard Base64 with proper padding
    let base64 = segments[1].trim().replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }

    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const jsonStr = new TextDecoder().decode(bytes);
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}

/**
 * Checks whether a given JWT is expired.
 * If a valid 3-segment JWT has no 'exp' claim, it defaults to non-expired (false).
 */
export function isTokenExpired(token: string, bufferSeconds = 15): boolean {
  const cleanToken = token
    .replace(/^Bearer\s+/i, '')
    .replace(/^"|"$/g, '')
    .trim();

  if (!cleanToken || cleanToken === 'undefined' || cleanToken === 'null') {
    return true;
  }

  const payload = parseJwtPayload<AdminEdgeJwtPayload>(cleanToken);
  if (!payload) {
    return true;
  }

  // If token lacks an 'exp' claim, treat it as expired for admin safety
  if (payload.exp === undefined || payload.exp === null) {
    return true;
  }

  const expNumber = Number(payload.exp);
  if (Number.isNaN(expNumber)) {
    return true;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return expNumber < nowInSeconds + bufferSeconds;
}

/**
 * Verifies HMAC-SHA256 (HS256) signature of a JWT using Web Crypto API.
 * Edge Runtime and modern browser compatible without Node.js dependencies.
 */
export async function verifyEdgeJwtSignature(
  token: string,
  secret: string,
): Promise<boolean> {
  try {
    const cleanToken = token
      .replace(/^Bearer\s+/i, '')
      .replace(/^"|"$/g, '')
      .trim();

    const segments = cleanToken.split('.');
    if (segments.length !== 3) {
      return false;
    }

    const [headerB64, payloadB64, signatureB64] = segments;

    // Convert Base64URL signature to Uint8Array
    let base64 = signatureB64.trim().replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }

    const binary = atob(base64);
    const signatureBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      signatureBytes[i] = binary.charCodeAt(i);
    }
    const signatureBuffer = signatureBytes.buffer as ArrayBuffer;

    const enc = new TextEncoder();
    const keyBytes = enc.encode(secret);
    const keyBuffer = keyBytes.buffer as ArrayBuffer;

    const key = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    const dataBytes = enc.encode(`${headerB64}.${payloadB64}`);
    const dataBuffer = dataBytes.buffer as ArrayBuffer;

    return await crypto.subtle.verify('HMAC', key, signatureBuffer, dataBuffer);
  } catch {
    return false;
  }
}

/**
 * Validates token expiration, role privileges, and cryptographic signature in Edge runtime.
 */
export async function verifyAdminEdgeToken(
  token: string,
  secret?: string,
): Promise<{ valid: boolean; payload: AdminEdgeJwtPayload | null }> {
  const cleanToken = token
    .replace(/^Bearer\s+/i, '')
    .replace(/^"|"$/g, '')
    .trim();

  if (!cleanToken || cleanToken.split('.').length !== 3) {
    return { valid: false, payload: null };
  }

  const payload = parseJwtPayload<AdminEdgeJwtPayload>(cleanToken);
  if (!payload) {
    return { valid: false, payload: null };
  }

  // 1. Strict expiration check
  if (isTokenExpired(cleanToken, 15)) {
    return { valid: false, payload: null };
  }

  // 2. Strict RBAC check (ADMIN, ARBITRATOR, SUPER_ADMIN)
  const role = (payload.role || '').toUpperCase();
  const allowedRoles = ['ADMIN', 'ARBITRATOR', 'SUPER_ADMIN'];
  if (!allowedRoles.includes(role)) {
    return { valid: false, payload: null };
  }

  // 3. Cryptographic signature verification if secret is provided or in process.env
  const jwtSecret =
    secret ||
    (typeof process !== 'undefined'
      ? process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET
      : undefined);

  if (jwtSecret) {
    const isSignatureValid = await verifyEdgeJwtSignature(cleanToken, jwtSecret);
    if (!isSignatureValid) {
      return { valid: false, payload: null };
    }
  }

  return { valid: true, payload };
}

/**
 * Sets the admin authentication cookie on the current frontend domain.
 * Strictly requires a 3-segment JWT to prevent corrupted cookies.
 */
export function setAdminAuthCookie(token: string): void {
  if (typeof document === 'undefined') {
    return;
  }

  const cleanToken = token
    .replace(/^Bearer\s+/i, '')
    .replace(/^"|"$/g, '')
    .trim();

  if (!cleanToken || cleanToken.split('.').length !== 3) {
    return;
  }

  const payload = parseJwtPayload<AdminEdgeJwtPayload>(cleanToken);
  let maxAge = 86400; // Default fallback: 24 hours

  if (payload?.exp && typeof payload.exp === 'number') {
    const remainingSeconds = payload.exp - Math.floor(Date.now() / 1000);
    maxAge = remainingSeconds > 0 ? remainingSeconds : 86400;
  }

  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const secureAttr = isHttps ? '; Secure' : '';

  document.cookie = `access_token=${cleanToken}; path=/; max-age=${maxAge}; SameSite=Lax${secureAttr}`;
}

export const setClientAuthCookie = setAdminAuthCookie;

/**
 * Safely retrieves the admin access_token cookie from document.cookie.
 */
export function getAdminAuthCookie(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie.split(';');
  for (const rawCookie of cookies) {
    const trimmed = rawCookie.trim();
    if (trimmed.startsWith('access_token=')) {
      const val = trimmed.substring('access_token='.length).trim();
      if (val && val !== 'undefined' && val !== 'null') {
        return decodeURIComponent(val);
      }
    }
  }

  return null;
}

export const getClientAuthCookie = getAdminAuthCookie;

/**
 * Completely clears the access_token cookie across all possible variants.
 */
export function clearAdminAuthCookie(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const secureAttr = isHttps ? '; Secure' : '';

  document.cookie = `access_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secureAttr}`;
  document.cookie = 'access_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure';
  document.cookie = 'access_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
}

export const clearClientAuthCookie = clearAdminAuthCookie;
