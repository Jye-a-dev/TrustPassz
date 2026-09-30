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
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read access_token from cookie or Authorization header
  const cookieToken = request.cookies.get('access_token')?.value;
  const authHeader = request.headers.get('authorization');
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const token = cookieToken || headerToken;

  const payload = token ? parseJwtEdge(token) : null;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const isExpired = !payload || !payload.exp || payload.exp < nowInSeconds;
  const isAdminOrArbitrator =
    payload?.role === 'ADMIN' || payload?.role === 'ARBITRATOR';

  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isDashboardRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/deals') ||
    pathname.startsWith('/disputes') ||
    pathname.startsWith('/ai-lab') ||
    pathname.startsWith('/system-status') ||
    pathname.startsWith('/users') ||
    pathname.startsWith('/api-explorer');

  // 1. If valid admin session exists and visiting /login or /register, redirect to /dashboard
  if (isAuthRoute && !isExpired && isAdminOrArbitrator) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 2. Protect all admin dashboard routes
  if (isDashboardRoute) {
    if (!token || isExpired) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      const response = NextResponse.redirect(loginUrl);
      if (token) {
        response.cookies.delete('access_token');
      }
      return response;
    }

    if (!isAdminOrArbitrator) {
      // User has token but lacks ADMIN or ARBITRATOR role
      const forbiddenUrl = new URL('/login', request.url);
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
  ],
};
