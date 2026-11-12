import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

/**
 * 307 Temporary Redirect from legacy /orders to canonical /user/orders portal.
 */
export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/user/orders', request.url), 307);
}
