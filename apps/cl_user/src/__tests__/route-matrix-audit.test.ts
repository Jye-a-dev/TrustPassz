import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { proxy } from '../proxy';

function createMockJwt(expSecondsFromNow: number): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      sub: 'usr-audit-1',
      id: 'usr-audit-1',
      email: 'auditor@trustpassz.test',
      role: 'USER',
      exp: now + expSecondsFromNow,
    })
  ).toString('base64url');
  return `${header}.${payload}.mock_signature`;
}

test('Route Matrix & Gating Audit Suite', async (t) => {
  await t.test('1. Protected Routes Gating: Unauthenticated guest redirected to /login?callbackUrl=...', () => {
    const protectedPaths = [
      '/user',
      '/user/deals',
      '/user/deals/create',
      '/user/deals/deal-123/checkout',
      '/user/deals/deal-123/vault',
      '/user/deals/deal-123/receipt',
      '/user/orders',
      '/user/disputes',
      '/user/settings',
    ];

    for (const path of protectedPaths) {
      const req = new NextRequest(new URL(`http://localhost:5000${path}`));
      const res = proxy(req);

      assert.strictEqual(res.status, 307, `Expected 307 for path ${path}`);
      const location = res.headers.get('location') || '';
      assert.ok(location.includes('/login'), `Expected redirect to /login for path ${path}`);
      assert.ok(location.includes(`callbackUrl=${encodeURIComponent(path)}`), `Expected callbackUrl for path ${path}`);
      assert.ok(!location.includes('expired=1'), `Guest should not have expired=1 flag for path ${path}`);
    }
  });

  await t.test('2. Protected Routes Gating: Expired token redirected to /login?expired=1 and cookie deleted', () => {
    const expiredToken = createMockJwt(-3600); // Expired 1 hour ago
    const req = new NextRequest(new URL('http://localhost:5000/user/deals'), {
      headers: {
        cookie: `access_token=${expiredToken}`,
      },
    });

    const res = proxy(req);
    assert.strictEqual(res.status, 307);
    const location = res.headers.get('location') || '';
    assert.ok(location.includes('/login'));
    assert.ok(location.includes('callbackUrl=%2Fuser%2Fdeals'));
    assert.ok(location.includes('expired=1'), 'Expected expired=1 query param');

    const setCookie = res.headers.get('set-cookie') || '';
    assert.ok(setCookie.includes('access_token=;'), 'Expected access_token to be cleared');
  });

  await t.test('3. Protected Routes: Valid token allowed through to /user/*', () => {
    const validToken = createMockJwt(86400); // Valid for 24h
    const req = new NextRequest(new URL('http://localhost:5000/user/deals'), {
      headers: {
        cookie: `access_token=${validToken}`,
      },
    });

    const res = proxy(req);
    // NextResponse.next() returns 200 with x-middleware-next
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('x-middleware-next'), '1');
  });

  await t.test('4. Auth Routes: Authenticated user redirected to /user when accessing /login or /register', () => {
    const validToken = createMockJwt(86400);

    const loginReq = new NextRequest(new URL('http://localhost:5000/login'), {
      headers: { cookie: `access_token=${validToken}` },
    });
    const loginRes = proxy(loginReq);
    assert.strictEqual(loginRes.status, 307);
    assert.strictEqual(loginRes.headers.get('location'), 'http://localhost:5000/user');

    const registerReq = new NextRequest(new URL('http://localhost:5000/register'), {
      headers: { cookie: `access_token=${validToken}` },
    });
    const registerRes = proxy(registerReq);
    assert.strictEqual(registerRes.status, 307);
    assert.strictEqual(registerRes.headers.get('location'), 'http://localhost:5000/user');
  });

  await t.test('5. Auth Routes: Authenticated user with force=1 or expired=1 can view login page', () => {
    const validToken = createMockJwt(86400);

    const forceReq = new NextRequest(new URL('http://localhost:5000/login?force=1'), {
      headers: { cookie: `access_token=${validToken}` },
    });
    const forceRes = proxy(forceReq);
    assert.strictEqual(forceRes.status, 200);
    assert.strictEqual(forceRes.headers.get('x-middleware-next'), '1');

    const expiredReq = new NextRequest(new URL('http://localhost:5000/login?expired=1'), {
      headers: { cookie: `access_token=${validToken}` },
    });
    const expiredRes = proxy(expiredReq);
    assert.strictEqual(expiredRes.status, 200);
    assert.strictEqual(expiredRes.headers.get('x-middleware-next'), '1');
  });

  await t.test('6. Legacy Alias Redirects (307 Temporary Redirect)', () => {
    const aliases = [
      { from: '/dashboard', to: 'http://localhost:5000/user' },
      { from: '/deals/create', to: 'http://localhost:5000/user/deals/create' },
      { from: '/orders', to: 'http://localhost:5000/user/orders' },
      { from: '/settings', to: 'http://localhost:5000/user/settings' },
    ];

    for (const { from, to } of aliases) {
      const req = new NextRequest(new URL(`http://localhost:5000${from}`));
      const res = proxy(req);
      assert.strictEqual(res.status, 307, `Expected 307 for legacy alias ${from}`);
      assert.strictEqual(res.headers.get('location'), to, `Expected redirect to ${to}`);
    }
  });
});
