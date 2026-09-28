import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// FIX H3: Routes yêu cầu đăng nhập
const PROTECTED_ROUTES = ['/dashboard', '/deals/create', '/orders', '/settings'];

// FIX H3: Routes chỉ dành cho guest (đã đăng nhập → redirect ra)
const AUTH_ROUTES = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Chưa đăng nhập → cố vào trang bảo vệ → redirect /login?callbackUrl=...
  if (!token && PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Đã đăng nhập → cố vào /login hoặc /register → redirect /dashboard
  if (token && AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Chỉ chạy middleware trên các path cần thiết — bỏ qua static files, _next, api
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/deals/create/:path*',
    '/orders/:path*',
    '/settings/:path*',
    '/login',
    '/register',
  ],
};
