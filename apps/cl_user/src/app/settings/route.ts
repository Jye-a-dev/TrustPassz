import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

/**
 * 307 Temporary Redirect from legacy /settings to canonical /user/settings portal.
 */
export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/user/settings', request.url), 307);
}
