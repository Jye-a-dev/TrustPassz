import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isTokenExpired } from '@/lib/jwt-edge';

/**
 * Next.js Edge Middleware & Network Proxy for User Portal (cl_user).
 * Pre-emptively executes 307 HTTP redirects at edge network level before page hydration
 * to eliminate Flash of Unauthenticated Content (FOUC).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rawToken = request.cookies.get('access_token')?.value;
  const hasToken = Boolean(rawToken);
  const isExpired = !rawToken || isTokenExpired(rawToken, 15);
  const isAuthenticated = hasToken && !isExpired;

  // 1. Legacy Route Aliases (HTTP 307 Temporary Redirect)
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    return NextResponse.redirect(new URL('/user', request.url), 307);
  }
  if (pathname === '/deals/create' || pathname.startsWith('/deals/create/')) {
    return NextResponse.redirect(new URL('/user/deals/create', request.url), 307);
  }
  if (pathname === '/orders' || pathname.startsWith('/orders/')) {
    return NextResponse.redirect(new URL('/user/orders', request.url), 307);
  }
  if (pathname === '/settings' || pathname.startsWith('/settings/')) {
    return NextResponse.redirect(new URL('/user/settings', request.url), 307);
  }

  // 2. Protected User Routes (/user and /user/*)
  if (pathname === '/user' || pathname.startsWith('/user/')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      const callbackTarget = pathname + (request.nextUrl.search || '');
      loginUrl.searchParams.set('callbackUrl', encodeURIComponent(callbackTarget));

      if (hasToken && isExpired) {
        loginUrl.searchParams.set('expired', '1');
      }

      const response = NextResponse.redirect(loginUrl, 307);
      if (hasToken) {
        response.cookies.delete('access_token');
      }
      return response;
    }
  }

  // 3. Auth Routes (/login, /register)
  if (pathname === '/login' || pathname === '/register') {
    const isForceLogin =
      request.nextUrl.searchParams.get('force') === '1' ||
      request.nextUrl.searchParams.get('prompt') === 'login' ||
      request.nextUrl.searchParams.get('logout') === '1' ||
      request.nextUrl.searchParams.get('expired') === '1';

    if (isForceLogin) {
      const response = NextResponse.next();
      response.cookies.delete('access_token');
      return response;
    }

    if (isAuthenticated) {
      const rawCallbackUrl = request.nextUrl.searchParams.get('callbackUrl');
      let targetUrl = '/user';

      if (rawCallbackUrl) {
        try {
          const decoded = decodeURIComponent(rawCallbackUrl);
          if (
            decoded.startsWith('/') &&
            !decoded.startsWith('//') &&
            !decoded.startsWith('/login') &&
            !decoded.startsWith('/register')
          ) {
            targetUrl = decoded;
          }
        } catch {
          targetUrl = '/user';
        }
      }

      return NextResponse.redirect(new URL(targetUrl, request.url), 307);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const middleware = proxy;
export default proxy;

export const config = {
  matcher: [
    '/user',
    '/user/:path*',
    '/dashboard/:path*',
    '/dashboard',
    '/deals/create/:path*',
    '/deals/create',
    '/orders/:path*',
    '/orders',
    '/settings/:path*',
    '/settings',
    '/login',
    '/register',
  ],
};
