import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  parseJwtPayload,
  isTokenExpired,
  type AdminEdgeJwtPayload,
} from './lib/jwt-edge';

/**
 * Next.js Edge Network Proxy for Admin Portal (cl_admin).
 * Enforces Zero-Trust RBAC: strictly guards administrative routes against unauthenticated
 * or unauthorized (non-ADMIN / non-ARBITRATOR) sessions via HTTP 307 pre-render redirects.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const rawCookieToken = request.cookies.get('access_token')?.value;
  const authHeader = request.headers.get('authorization');
  const headerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7).trim()
    : null;
  const token = rawCookieToken || headerToken;

  const hasValidSession = Boolean(token && !isTokenExpired(token, 15));
  const payload = hasValidSession && token ? parseJwtPayload<AdminEdgeJwtPayload>(token) : null;

  const userRole = (payload?.role || '').toUpperCase();
  const isPrivilegedAdmin =
    userRole === 'ADMIN' ||
    userRole === 'ARBITRATOR' ||
    userRole === 'SUPER_ADMIN';

  // 1. Root route handling: redirect to /dashboard if privileged, else /login
  if (pathname === '/') {
    const targetPath = hasValidSession && isPrivilegedAdmin ? '/dashboard' : '/login';
    return NextResponse.redirect(new URL(targetPath, request.url), 307);
  }

  // 2. Auth Route (/login)
  if (pathname === '/login') {
    const hasUnauthQuery =
      request.nextUrl.searchParams.get('expired') === '1' ||
      request.nextUrl.searchParams.get('logout') === '1' ||
      request.nextUrl.searchParams.get('edge_unauth') === '1' ||
      request.nextUrl.searchParams.get('force') === '1' ||
      request.nextUrl.searchParams.get('prompt') === 'login';

    if (hasUnauthQuery || !hasValidSession || !isPrivilegedAdmin) {
      const response = NextResponse.next();
      if (token && (hasUnauthQuery || !hasValidSession || !isPrivilegedAdmin)) {
        response.cookies.delete('access_token');
      }
      return response;
    }

    // Already authenticated with valid admin privileges -> redirect to /dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url), 307);
  }

  // 3. Protected Admin Routes
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/deals') ||
    pathname.startsWith('/disputes') ||
    pathname.startsWith('/users') ||
    pathname.startsWith('/system-status') ||
    pathname.startsWith('/ai-lab') ||
    pathname.startsWith('/api-explorer') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/admin');

  if (isProtectedRoute) {
    // 3a. Missing or expired session -> Redirect to /login with edge_unauth=1
    if (!hasValidSession) {
      const loginUrl = new URL('/login', request.url);
      const callbackTarget = pathname + (request.nextUrl.search || '');
      loginUrl.searchParams.set('callbackUrl', encodeURIComponent(callbackTarget));
      loginUrl.searchParams.set('edge_unauth', '1');

      const response = NextResponse.redirect(loginUrl, 307);
      if (token) {
        response.cookies.delete('access_token');
      }
      return response;
    }

    // 3b. Insufficient privilege (role is not ADMIN, ARBITRATOR, or SUPER_ADMIN) -> Redirect to /403, NOT /login
    if (!isPrivilegedAdmin) {
      const forbiddenUrl = new URL('/403', request.url);
      return NextResponse.redirect(forbiddenUrl, 307);
    }
  }

  return NextResponse.next();
}

export const middleware = proxy;
export default proxy;

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/deals/:path*',
    '/disputes/:path*',
    '/users/:path*',
    '/system-status/:path*',
    '/ai-lab/:path*',
    '/api-explorer/:path*',
    '/settings/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/login',
  ],
};
