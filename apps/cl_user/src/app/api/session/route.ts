import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isTokenExpired, parseJwtPayload, type EdgeJwtPayload } from "@/lib/jwt-edge";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;

  if (!token || isTokenExpired(token, 15)) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
  }

  const payload = parseJwtPayload<EdgeJwtPayload>(token);
  if (!payload) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
  }

  const user = {
    id: (payload.id as string) || (payload.sub as string) || "usr-1",
    email: payload.email || null,
    walletAddress:
      (payload.walletAddress as string) ||
      (payload.wallet_address as string) ||
      null,
    role: (payload.role as string) || "USER",
    displayName:
      (payload.displayName as string) ||
      (payload.email ? payload.email.split("@")[0] : "Trader"),
  };

  return NextResponse.json({ authenticated: true, user, token }, { status: 200 });
}

