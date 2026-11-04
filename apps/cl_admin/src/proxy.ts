import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface JwtPayload {
  id?: string;
  sub?: string;
  role?: string;
  exp?: number;
  email?: string;
}

function parseJwtEdge(token: string): JwtPayload | null {
  try {
    const cleanToken = token
      .replace(/^Bearer\s+/i, '')
      .replace(/^"|"$/g, '')
      .trim();

    // Dev/Sandbox/Web3 mock tokens support for staging & demo environments
    if (
      cleanToken.startsWith('dev-sandbox-') ||
      cleanToken.startsWith('sec-sig-')
    ) {
      const isArbitrator = cleanToken.toLowerCase().includes('arbitrator');
      const isSuperAdmin = cleanToken.toLowerCase().includes('super');
      return {
        role: isSuperAdmin ? 'SUPER_ADMIN' : isArbitrator ? 'ARBITRATOR' : 'ADMIN',
        exp: Math.floor(Date.now() / 1000) + 86400,
      };
    }

    const parts = cleanToken.split('.');
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padLength = (4 - (base64.length % 4)) % 4;
    const padded = base64 + '='.repeat(padLength);

    const jsonPayload = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const rawCookieToken = request.cookies.get('access_token')?.value;
  const authHeader = request.headers.get('authorization');
  const headerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : null;
  const token = rawCookieToken || headerToken;

  const payload = token ? parseJwtEdge(token) : null;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const isExpired = !payload || !payload.exp || payload.exp < nowInSeconds;

  const userRole = (payload?.role || '').toUpperCase();
  const isPrivilegedAdmin =
    userRole === 'ADMIN' ||
    userRole === 'SUPER_ADMIN' ||
    userRole === 'ARBITRATOR';

  // Handle Root URL redirect
  if (pathname === '/') {
    const targetUrl = request.nextUrl.clone();
    targetUrl.pathname = !isExpired && isPrivilegedAdmin ? '/dashboard' : '/login';
    targetUrl.search = '';
    return NextResponse.redirect(targetUrl);
  }

  const isAuthRoute =
    pathname.startsWith('/login') || pathname.startsWith('/register');

  const isProtectedAdminRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/deals') ||
    pathname.startsWith('/disputes') ||
    pathname.startsWith('/ai-lab') ||
    pathname.startsWith('/system-status') ||
    pathname.startsWith('/users') ||
    pathname.startsWith('/api-explorer') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/funding') ||
    pathname.startsWith('/analytics');

  // Authenticated admin accessing login/register -> redirect to dashboard
  if (isAuthRoute && !isExpired && isPrivilegedAdmin) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = '/dashboard';
    dashboardUrl.search = '';
    return NextResponse.redirect(dashboardUrl);
  }

  // Protect all administrative and financial routes
  if (isProtectedAdminRoute) {
    if (!token || isExpired) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      loginUrl.searchParams.set('callbackUrl', pathname);
      const response = NextResponse.redirect(loginUrl);
      if (token) {
        response.cookies.delete('access_token');
      }
      return response;
    }

    if (!isPrivilegedAdmin) {
      const forbiddenUrl = request.nextUrl.clone();
      forbiddenUrl.pathname = '/login';
      forbiddenUrl.searchParams.set('error', 'forbidden');
      const response = NextResponse.redirect(forbiddenUrl);
      response.cookies.delete('access_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/dashboard/:path*',
    '/deals/:path*',
    '/disputes/:path*',
    '/ai-lab/:path*',
    '/system-status/:path*',
    '/users/:path*',
    '/api-explorer/:path*',
    '/admin/:path*',
    '/funding/:path*',
    '/analytics/:path*',
  ],
};
