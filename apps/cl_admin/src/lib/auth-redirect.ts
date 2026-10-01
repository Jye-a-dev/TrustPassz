/**
 * Helper utility to sanitize callback redirect URLs and prevent Open Redirect vulnerabilities.
 */

const DANGEROUS_PROTOCOLS = ['http:', 'https:', 'javascript:', 'data:', 'vbscript:'];
const AUTH_ROUTES = ['/login', '/register'];

/**
 * Validates and sanitizes a callback redirect URL.
 * 
 * Rules:
 * 1. Must be an internal path starting with a single '/'
 * 2. Blocks protocol-relative URLs (//, /\, \)
 * 3. Blocks external protocol schemes (http:, https:, javascript:, data:, etc.)
 * 4. Blocks redirect loops (pointing back to /login or /register)
 *
 * @param url The raw callback URL from query parameters
 * @param fallback The safe default destination (defaults to '/dashboard')
 * @returns A guaranteed safe internal path
 */
export function sanitizeCallbackUrl(url: string | null | undefined, fallback = '/dashboard'): string {
  if (!url || typeof url !== 'string') {
    return fallback;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return fallback;
  }

  // 1. Block protocol-relative URLs: //evil.com, /\evil.com, \evil.com
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\') || trimmed.startsWith('\\')) {
    return fallback;
  }

  // 2. Must start with a single leading '/'
  if (!trimmed.startsWith('/')) {
    return fallback;
  }

  // 3. Block dangerous protocol injections
  const lower = trimmed.toLowerCase();
  for (const protocol of DANGEROUS_PROTOCOLS) {
    if (lower.includes(protocol)) {
      return fallback;
    }
  }

  // 4. Block redirect loops to authentication surfaces
  const pathWithoutQuery = trimmed.split('?')[0].split('#')[0].toLowerCase();
  for (const authRoute of AUTH_ROUTES) {
    if (pathWithoutQuery === authRoute || pathWithoutQuery.startsWith(`${authRoute}/`)) {
      return fallback;
    }
  }

  return trimmed;
}
