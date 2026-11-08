import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

/**
 * 307 Temporary Redirect from legacy /deals/create to canonical /user/deals/create.
 * Prevents conflict with dynamic route /deals/[id].
 */
export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/user/deals/create', request.url), 307);
}
