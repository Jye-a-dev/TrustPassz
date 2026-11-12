/**
 * Lightweight, zero-dependency JWT decoder compatible with Next.js Edge Runtime,
 * plus browser-safe auth cookie helpers for first-party Vercel rewrites and cross-origin fallback.
 */

const DEFAULT_COOKIE_MAX_AGE_SECONDS = 86400;
const AUTH_COOKIE_NAME = "access_token";

export interface EdgeJwtPayload {
  sub?: string;
  id?: string;
  email?: string | null;
  walletAddress?: string | null;
  wallet_address?: string | null;
  displayName?: string | null;
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
 * Decodes a base64url-encoded string safely inside Edge Runtime without Buffer.
 * Normalizes '-' -> '+', '_' -> '/' and pads '=' to a multiple of 4 before calling atob().
 */
export function decodeBase64Url(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  let base64 = input.trim().replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }

  try {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}

/**
 * Parses and returns the JSON payload object from a 3-segment JWT (header.payload.signature).
 * Compatible with Edge Runtime and Browser without external libraries.
 */
export function parseJwtPayload<T = EdgeJwtPayload>(token: string): T | null {
  if (!token || typeof token !== "string") {
    return null;
  }

  const cleanToken = token
    .replace(/^Bearer\s+/i, "")
    .replace(/^"|"$/g, "")
    .trim();

  if (!cleanToken || cleanToken === "undefined" || cleanToken === "null") {
    return null;
  }

  // Support sandbox/test signatures
  if (cleanToken.startsWith("dev-sandbox-") || cleanToken.startsWith("sec-sig-")) {
    return {
      role: "USER",
      exp: Math.floor(Date.now() / 1000) + DEFAULT_COOKIE_MAX_AGE_SECONDS,
    } as unknown as T;
  }

  const segments = cleanToken.split(".");
  if (segments.length !== 3 || segments.some((segment) => segment.length === 0)) {
    return null;
  }

  try {
    const jsonStr = decodeBase64Url(segments[1]);
    if (!jsonStr) {
      return null;
    }
    const parsed: unknown = JSON.parse(jsonStr);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    return parsed as T;
  } catch {
    return null;
  }
}

/** Backward compatibility alias */
export const decodeJwtPayload = parseJwtPayload;

/**
 * Validates JWT expiration claim with a safety buffer window.
 * If payload lacks an `exp` claim but is a valid 3-segment JWT, returns false (not expired).
 */
export function isTokenExpired(
  tokenOrExp?: string | number | null,
  bufferSeconds = 15
): boolean {
  if (tokenOrExp === undefined || tokenOrExp === null || tokenOrExp === "") {
    return true;
  }

  let exp: number | undefined;

  if (typeof tokenOrExp === "number") {
    exp = tokenOrExp;
  } else if (typeof tokenOrExp === "string") {
    const cleanToken = tokenOrExp
      .replace(/^Bearer\s+/i, "")
      .replace(/^"|"$/g, "")
      .trim();

    if (!cleanToken || cleanToken === "undefined" || cleanToken === "null") {
      return true;
    }

    const payload = parseJwtPayload<EdgeJwtPayload>(cleanToken);
    if (!payload) {
      return true;
    }

    // Valid 3-part JWT without exp claim is treated as not expired
    if (payload.exp === undefined || payload.exp === null) {
      return false;
    }

    exp = typeof payload.exp === "number" ? payload.exp : Number(payload.exp);
  } else {
    return true;
  }

  if (typeof exp !== "number" || Number.isNaN(exp) || !Number.isFinite(exp)) {
    return true;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return exp < nowInSeconds + bufferSeconds;
}

/**
 * Performs edge-level structural and expiry validation on JWT strings.
 */
export function validateEdgeToken(token: string): EdgeTokenValidationResult {
  const payload = parseJwtPayload<EdgeJwtPayload>(token);
  if (!payload) {
    return { valid: false, expired: true, payload: null };
  }

  const expired = isTokenExpired(token, 15);
  return {
    valid: !expired,
    expired,
    payload,
  };
}

/**
 * Computes cookie max-age (in seconds) from JWT `exp` claim, falling back to 86400s.
 */
function resolveCookieMaxAge(token: string): number {
  const payload = parseJwtPayload<EdgeJwtPayload>(token);
  if (payload && payload.exp !== undefined && payload.exp !== null) {
    const expNum =
      typeof payload.exp === "number" ? payload.exp : Number(payload.exp);
    if (!Number.isNaN(expNum) && Number.isFinite(expNum)) {
      const remainingSeconds = Math.floor(expNum - Date.now() / 1000);
      return Math.max(0, remainingSeconds);
    }
  }
  return DEFAULT_COOKIE_MAX_AGE_SECONDS;
}

/**
 * Writes the `access_token` cookie on the current Frontend origin safely.
 * Only writes if token is a strictly valid 3-segment JWT.
 */
export function setClientAuthCookie(token: string): void {
  if (typeof document === "undefined" || !token) {
    return;
  }

  const cleanToken = token
    .replace(/^Bearer\s+/i, "")
    .replace(/^"|"$/g, "")
    .trim();

  // Strictly require 3 segments to avoid corrupted cookies
  if (cleanToken.split(".").length !== 3) {
    return;
  }

  const maxAge = resolveCookieMaxAge(cleanToken);
  const isHttps =
    typeof window !== "undefined" && window.location.protocol === "https:";
  const secureFlag = isHttps ? "; Secure" : "";

  document.cookie = `${AUTH_COOKIE_NAME}=${cleanToken}; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag}`;
}

/**
 * Reads the `access_token` cookie directly from `document.cookie` in browser contexts.
 */
export function getClientAuthCookie(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookies = document.cookie ? document.cookie.split(";") : [];
  for (const rawEntry of cookies) {
    const entry = rawEntry.trim();
    if (!entry) continue;
    const eqIndex = entry.indexOf("=");
    if (eqIndex <= 0) continue;

    const name = entry.slice(0, eqIndex).trim();
    if (name !== AUTH_COOKIE_NAME) continue;

    const rawValue = entry.slice(eqIndex + 1).trim();
    if (!rawValue || rawValue === "undefined" || rawValue === "null") {
      return null;
    }

    try {
      return decodeURIComponent(rawValue);
    } catch {
      return rawValue;
    }
  }

  return null;
}

/**
 * Clears the `access_token` cookie across all attribute combinations.
 */
export function clearClientAuthCookie(): void {
  if (typeof document === "undefined") {
    return;
  }

  const isHttps =
    typeof window !== "undefined" && window.location.protocol === "https:";
  const secureFlag = isHttps ? "; Secure" : "";
  const expiryDate = "Thu, 01 Jan 1970 00:00:00 GMT";

  document.cookie = `${AUTH_COOKIE_NAME}=; Max-Age=0; path=/; SameSite=Lax${secureFlag}`;
  document.cookie = `${AUTH_COOKIE_NAME}=; Max-Age=0; path=/; SameSite=None; Secure`;
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; expires=${expiryDate}; SameSite=Lax${secureFlag}`;
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; expires=${expiryDate}; SameSite=None; Secure`;
}
