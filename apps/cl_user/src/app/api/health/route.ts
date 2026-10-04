import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: typeof process !== "undefined" && typeof process.uptime === "function" ? process.uptime() : 0,
      version: "1.0.0",
      framework: "Next.js App Router",
      engine: "Cloudflare Edge",
    },
    { status: 200 }
  );
}

