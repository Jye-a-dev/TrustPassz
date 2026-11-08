import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isTokenExpired } from '@/lib/jwt-edge';

/**
 * Next.js Edge Middleware & Proxy handler.
 * Enforces session lifecycle verification, legacy aliases 307 routing, and route gating.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rawToken = request.cookies.get('access_token')?.value;
  const hasToken = Boolean(rawToken);
  const isExpired = !rawToken || isTokenExpired(rawToken, 15);
  const isAuthenticated = hasToken && !isExpired;

  // 1. Alias redirects (307 Temporary Redirect)
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

  // 2. Protected Routes (/user and /user/*)
  if (pathname === '/user' || pathname.startsWith('/user/')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      const callbackTarget = pathname + (request.nextUrl.search || '');
      loginUrl.searchParams.set('callbackUrl', callbackTarget);

      // Nếu có token nhưng đã hết hạn -> kích hoạt thông báo phiên hết hạn
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

    // Người dùng đã có token hợp lệ -> tự động chuyển hướng vào /user (hoặc callbackUrl nếu có)
    if (isAuthenticated) {
      const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');
      const targetUrl =
        callbackUrl &&
        callbackUrl.startsWith('/') &&
        !callbackUrl.startsWith('/login') &&
        !callbackUrl.startsWith('/register')
          ? callbackUrl
          : '/user';

      return NextResponse.redirect(new URL(targetUrl, request.url), 307);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const middleware = proxy;

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
