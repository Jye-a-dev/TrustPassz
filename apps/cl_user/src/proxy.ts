import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isTokenExpired } from "@/lib/jwt-edge";

const AUTH_COOKIE_NAME = "access_token";

function resolveSafeCallbackUrl(rawCallbackUrl: string | null): string {
  if (!rawCallbackUrl) {
    return "/user";
  }

  try {
    const decoded = decodeURIComponent(rawCallbackUrl);
    if (
      decoded.startsWith("/") &&
      !decoded.startsWith("//") &&
      !decoded.startsWith("/login") &&
      !decoded.startsWith("/register")
    ) {
      return decoded;
    }
  } catch {
    return "/user";
  }

  return "/user";
}

/**
 * Next.js Edge Middleware & Network Proxy for User Portal (cl_user).
 * Pre-emptively executes 307 HTTP redirects at edge network level before page hydration
 * while preventing Edge <-> Client redirect loops via `edge_unauth=1`.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname, search, searchParams } = request.nextUrl;
  const rawToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const hasToken = Boolean(rawToken);
  const isExpired = !rawToken || isTokenExpired(rawToken, 15);
  const isAuthenticated = hasToken && !isExpired;

  // 1. Legacy Route Aliases (HTTP 307 Temporary Redirect)
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return NextResponse.redirect(new URL("/user", request.url), 307);
  }
  if (pathname === "/deals/create" || pathname.startsWith("/deals/create/")) {
    return NextResponse.redirect(new URL("/user/deals/create", request.url), 307);
  }
  if (pathname === "/orders" || pathname.startsWith("/orders/")) {
    return NextResponse.redirect(new URL("/user/orders", request.url), 307);
  }
  if (pathname === "/settings" || pathname.startsWith("/settings/")) {
    return NextResponse.redirect(new URL("/user/settings", request.url), 307);
  }

  // 2. Protected User Routes (/user and /user/*)
  if (pathname === "/user" || pathname.startsWith("/user/")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      const callbackTarget = pathname + (search || "");
      loginUrl.searchParams.set("callbackUrl", callbackTarget);
      loginUrl.searchParams.set("edge_unauth", "1");

      if (hasToken && isExpired) {
        loginUrl.searchParams.set("expired", "1");
      }

      const response = NextResponse.redirect(loginUrl, 307);
      response.cookies.delete(AUTH_COOKIE_NAME);
      return response;
    }

    return NextResponse.next();
  }

  // 3. Auth Routes (/login, /register)
  if (pathname === "/login" || pathname === "/register") {
    const hasBypassParam =
      searchParams.get("expired") === "1" ||
      searchParams.get("logout") === "1" ||
      searchParams.get("edge_unauth") === "1" ||
      searchParams.get("force") === "1" ||
      searchParams.get("prompt") === "login";

    if (hasBypassParam) {
      const response = NextResponse.next();
      response.cookies.delete(AUTH_COOKIE_NAME);
      return response;
    }

    if (isAuthenticated) {
      const targetUrl = resolveSafeCallbackUrl(searchParams.get("callbackUrl"));
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
    "/user",
    "/user/:path*",
    "/dashboard/:path*",
    "/dashboard",
    "/deals/create/:path*",
    "/deals/create",
    "/orders/:path*",
    "/orders",
    "/settings/:path*",
    "/settings",
    "/login",
    "/register",
  ],
};
