import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

/**
 * 307 Temporary Redirect from legacy /dashboard to canonical /user portal.
 */
export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/user', request.url), 307);
}
