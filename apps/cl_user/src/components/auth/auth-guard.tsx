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
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const setAuth = useAuthStore((s) => s.setAuth);
  const checkSessionExpiry = useAuthStore((s) => s.checkSessionExpiry);

  const [isVerifyingServerSession, setIsVerifyingServerSession] = useState(false);
  const [serverSessionChecked, setServerSessionChecked] = useState(false);

  // Client mount: kick off Zustand rehydration and guarantee hydration flag flips
  useEffect(() => {
    if (typeof useAuthStore.persist?.rehydrate === "function") {
      void useAuthStore.persist.rehydrate();
    }
    if (typeof useAuthStore.persist?.hasHydrated === "function" && useAuthStore.persist.hasHydrated()) {
      useAuthStore.setState({ _hasHydrated: true, isLoading: false });
    } else {
      const timer = setTimeout(() => {
        useAuthStore.setState({ _hasHydrated: true, isLoading: false });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, []);

  // Failsafe Timeout 2000ms: prevent hanging in INITIALIZING AUTH ENCLAVE...
  useEffect(() => {
    const failsafeTimer = setTimeout(() => {
      const state = useAuthStore.getState();
      if (!state._hasHydrated || !serverSessionChecked) {
        console.warn("[AuthGuard] Failsafe timeout 2000ms triggered. Unblocking auth state.");
        useAuthStore.setState({ _hasHydrated: true, isLoading: false });
        setServerSessionChecked(true);
        setIsVerifyingServerSession(false);

        if (!state.isAuthenticated || !state.user) {
          const currentPath = typeof window !== "undefined" ? window.location.pathname : "/user";
          if (currentPath !== "/login") {
            router.replace(`/login?force=1&callbackUrl=${encodeURIComponent(currentPath)}`);
          }
        }
      }
    }, 2000);

    return () => clearTimeout(failsafeTimer);
  }, [serverSessionChecked, router]);

  useEffect(() => {
    let isCancelled = false;

    async function syncSessionWithServer() {
      // 1. Wait until Zustand finishes reading localStorage
      if (!hasHydrated) {
        return;
      }

      // If already authenticated with a valid user, unlock immediately and skip active probe
      const currentToken = useAuthStore.getState().token;
      const currentUser = useAuthStore.getState().user;
      const isAuth = useAuthStore.getState().isAuthenticated;

      if (isAuth && currentUser && (!currentToken || !isTokenExpired(currentToken, 15))) {
        setServerSessionChecked(true);
        return;
      }

      // 2. Cookie check
      if (typeof document !== "undefined") {
        const match = document.cookie.match(/(?:^|; )access_token=([^;]*)/);
        const cookieToken = match ? decodeURIComponent(match[1]) : null;

        if (cookieToken && !isTokenExpired(cookieToken, 15)) {
          const payload = parseJwtPayload(cookieToken);
          if (payload) {
            setAuth(
              {
                id: (payload.id as string) || (payload.sub as string) || "usr-1",
                email: payload.email,
                walletAddress:
                  (payload.walletAddress as string) ||
                  (payload.wallet_address as string),
                role: (payload.role as string) || "USER",
                displayName:
                  (payload.displayName as string) ||
                  (payload.email ? payload.email.split("@")[0] : "Trader"),
              },
              cookieToken
            );
            if (!isCancelled) {
              setServerSessionChecked(true);
            }
            return;
          }
        }
      }

      // 3. Fallback: Query /api/v1/auth/me to recover HttpOnly cookie session from backend Render via Next.js rewrite
      setIsVerifyingServerSession(true);
      try {
        const res = await fetch("/api/v1/auth/me", {
          credentials: "include",
          headers: { Accept: "application/json" },
        });

        if (res.ok && !isCancelled) {
          const data = await res.json();
          const fetchedUser = data?.user || data?.data?.user;
          const fetchedToken = data?.token || data?.accessToken || data?.access_token || null;
          if (fetchedUser) {
            setAuth(fetchedUser, fetchedToken);
          }
        }
      } catch {
        // Non-fatal probe fallback
      } finally {
        if (!isCancelled) {
          setIsVerifyingServerSession(false);
          setServerSessionChecked(true);
          useAuthStore.setState({ isLoading: false });
        }
      }
    }

    void syncSessionWithServer();

    return () => {
      isCancelled = true;
    };
  }, [hasHydrated, setAuth]);

  // Proactive check when user switches back to tab
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

  const activeUser = user || useAuthStore.getState().user;
  const isAuth = isAuthenticated || useAuthStore.getState().isAuthenticated;
  const isReady = isAuth && Boolean(activeUser);

  // If already authenticated with user, render children immediately!
  // Otherwise, only wait for hydration and server session check if NOT yet ready
  if (!isReady && (!hasHydrated || !serverSessionChecked)) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-3">
        <div className="size-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shadow-[0_0_20px_rgba(6,182,212,0.3)]" />
        <span className="text-xs font-mono text-cyan-400/80 animate-pulse tracking-wider">
          {isVerifyingServerSession
            ? "SYNCHRONIZING SECURE SESSION..."
            : "INITIALIZING AUTH ENCLAVE..."}
        </span>
      </div>
    );
  }

  // Not authenticated: render UnauthScreen with preserved callbackUrl
  if (!isAuth || !activeUser) {
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
