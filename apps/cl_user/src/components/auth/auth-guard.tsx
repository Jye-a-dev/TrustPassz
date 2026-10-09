"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { isTokenExpired, parseJwtPayload } from "@/lib/jwt-edge";
import { Button } from "@/components/ui/button";
import { UnauthScreen } from "@/components/auth/unauth-screen";

interface AuthGuardProps {
  children: React.ReactNode;
  /** Roles allowed to view this wrapped tree (e.g. ['ADMIN', 'ARBITRATOR']) */
  requiredRoles?: string[];
  /** Optional custom fallback component displayed during hydration/authorization */
  fallback?: React.ReactNode;
}

/**
 * Client-Side Authorization Guard & Session Synchronizer.
 * Inspects cookie tokens, Zustand auth-store state, verifies roles, handles hydration,
 * actively performs proactive token expiry verification on tab change / window focus,
 * and recovers sessions gracefully from valid access_token cookies.
 */
export function AuthGuard({
  children,
  requiredRoles,
  fallback,
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const checkSessionExpiry = useAuthStore((s) => s.checkSessionExpiry);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function recoverSession() {
      // 1. Recover session from document.cookie (if non-httpOnly)
      if (typeof document !== "undefined") {
        const match = document.cookie.match(/(?:^|; )access_token=([^;]*)/);
        const cookieToken = match ? decodeURIComponent(match[1]) : null;

        if (cookieToken && !isTokenExpired(cookieToken, 15)) {
          const storeState = useAuthStore.getState();
          if (!storeState.isAuthenticated || !storeState.user) {
            const payload = parseJwtPayload(cookieToken);
            if (payload) {
              storeState.setAuth(
                {
                  id: (payload.id as string) || (payload.sub as string) || "usr-1",
                  email: payload.email,
                  walletAddress: (payload.walletAddress as string) || (payload.wallet_address as string),
                  role: (payload.role as string) || "USER",
                  displayName:
                    (payload.displayName as string) ||
                    (payload.email ? payload.email.split("@")[0] : "Trader"),
                },
                cookieToken
              );
            }
          }
        }
      }

      // 2. Query /api/session to recover httpOnly cookie session from Edge
      if (!useAuthStore.getState().isAuthenticated || !useAuthStore.getState().user) {
        try {
          const res = await fetch("/api/session");
          if (res.ok && !isCancelled) {
            const data = await res.json();
            if (data?.authenticated && data?.user) {
              useAuthStore.getState().setAuth(data.user, data.token);
            }
          }
        } catch {
          // Non-fatal session probe fallback
        }
      }

      if (!isCancelled) {
        setMounted(true);
        if (useAuthStore.getState().isAuthenticated) {
          useAuthStore.getState().checkSessionExpiry();
        }
      }
    }

    void recoverSession();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Proactive check when user switches back to tab after inactive duration
  useEffect(() => {
    const handleActiveFocus = () => {
      if (document.visibilityState === "visible" && isAuthenticated) {
        checkSessionExpiry();
      }
    };

    window.addEventListener("visibilitychange", handleActiveFocus);
    window.addEventListener("focus", handleActiveFocus);

    return () => {
      window.removeEventListener("visibilitychange", handleActiveFocus);
      window.removeEventListener("focus", handleActiveFocus);
    };
  }, [isAuthenticated, checkSessionExpiry]);

  // Global listener for 401 Unauthorized API responses across the app
  useEffect(() => {
    const handleUnauthorizedEvent = () => {
      logout(true);
    };

    window.addEventListener("auth:unauthorized", handleUnauthorizedEvent);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorizedEvent);
    };
  }, [logout]);

  // Wait for client hydration to prevent SSR mismatch
  if (!mounted) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-3">
        <div className="size-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shadow-[0_0_20px_rgba(6,182,212,0.3)]" />
        <span className="text-xs font-mono text-cyan-400/80 animate-pulse tracking-wider">
          VERIFYING SESSION ENCLAVE...
        </span>
      </div>
    );
  }

  // Double-check cookie before declaring unauthenticated
  const activeUser = user || useAuthStore.getState().user;
  const isAuth = isAuthenticated || useAuthStore.getState().isAuthenticated;

  // Not authenticated: render UnauthScreen with preserved callbackUrl
  if (!isAuth || !activeUser) {
    // Last-ditch cookie recovery check
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|; )access_token=([^;]*)/);
      const cookieToken = match ? decodeURIComponent(match[1]) : null;
      if (cookieToken && !isTokenExpired(cookieToken, 15)) {
        const payload = parseJwtPayload(cookieToken);
        if (payload) {
          useAuthStore.getState().setAuth(
            {
              id: (payload.id as string) || (payload.sub as string) || "usr-1",
              email: payload.email,
              walletAddress: (payload.walletAddress as string) || (payload.wallet_address as string),
              role: (payload.role as string) || "USER",
              displayName:
                (payload.displayName as string) ||
                (payload.email ? payload.email.split("@")[0] : "Trader"),
            },
            cookieToken
          );
          return <>{children}</>;
        }
      }
    }

    const currentQuery = searchParams?.toString();
    const fullCurrentUrl = `${pathname}${currentQuery ? `?${currentQuery}` : ""}`;

    return fallback ? (
      <>{fallback}</>
    ) : (
      <UnauthScreen callbackUrl={fullCurrentUrl} />
    );
  }

  // Role validation
  if (requiredRoles && requiredRoles.length > 0) {
    const userRole = (activeUser?.role || "").toUpperCase();
    const hasRole = requiredRoles
      .map((r) => r.toUpperCase())
      .includes(userRole);

    if (!hasRole) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Không đủ quyền hạn</h2>
            <p className="mt-1 text-sm text-slate-400">
              Tài khoản của bạn ({userRole}) không có quyền truy cập vào tài nguyên này.
            </p>
          </div>
          <Button variant="outline" onClick={() => router.replace("/user")}>
            Quay lại trang cá nhân
          </Button>
        </div>
      );
    }
  }

  return <>{children}</>;
}
