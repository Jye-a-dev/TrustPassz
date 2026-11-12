import test from "node:test";
import assert from "node:assert/strict";
import {
  parseJwtPayload,
  isTokenExpired,
  validateEdgeToken,
  setClientAuthCookie,
  getClientAuthCookie,
  clearClientAuthCookie,
} from "../lib/jwt-edge";

test("JWT Edge Session & Expiry Protocol Tests", async (t) => {
  await t.test("should parse base64url JWT payload correctly without external dependencies", () => {
    const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ sub: "usr-123", role: "USER", exp: 1893456000 })).toString("base64url");
    const token = `${header}.${payload}.sig`;

    const parsed = parseJwtPayload(token);
    assert.ok(parsed);
    assert.equal(parsed?.sub, "usr-123");
    assert.equal(parsed?.role, "USER");
    assert.equal(parsed?.exp, 1893456000);
  });

  await t.test("should return true for expired tokens or tokens within safe buffer (15s)", () => {
    const nowSec = Math.floor(Date.now() / 1000);

    assert.equal(isTokenExpired(nowSec - 100, 15), true);
    assert.equal(isTokenExpired(nowSec + 5, 15), true);
    assert.equal(isTokenExpired(nowSec + 60, 15), false);
  });

  await t.test("should treat valid 3-segment JWT without exp claim as not expired", () => {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ sub: "usr-no-exp", role: "USER" })).toString("base64url");
    const tokenWithoutExp = `${header}.${payload}.sig`;

    assert.equal(isTokenExpired(tokenWithoutExp, 15), false);
    const validated = validateEdgeToken(tokenWithoutExp);
    assert.equal(validated.valid, true);
    assert.equal(validated.expired, false);
    assert.equal(validated.payload?.sub, "usr-no-exp");
  });

  await t.test("should treat malformed or missing token as expired", () => {
    assert.equal(isTokenExpired(""), true);
    assert.equal(isTokenExpired(undefined as unknown as string), true);
    assert.equal(isTokenExpired("invalid.jwt.token"), true);
  });

  await t.test("should validate edge token structure and return validation result", () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ id: "u-99", exp: futureExp })).toString("base64url");
    const validToken = `${header}.${payload}.sig`;

    const res = validateEdgeToken(validToken);
    assert.equal(res.valid, true);
    assert.equal(res.expired, false);
    assert.equal(res.payload?.id, "u-99");
  });

  await t.test("should safely write, read, and clear client auth cookie with Secure flag on HTTPS", () => {
    const originalDocument = globalThis.document;
    const originalWindow = globalThis.window;
    const cookieWrites: string[] = [];
    let cookieStore = "";

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { location: { protocol: "https:" } },
    });
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        get cookie() {
          return cookieStore;
        },
        set cookie(val: string) {
          cookieWrites.push(val);
          const pair = val.split(";")[0];
          const [name, value] = pair.split("=");
          if (val.includes("Max-Age=0") || val.includes("expires=Thu, 01 Jan 1970")) {
            cookieStore = "";
          } else {
            cookieStore = `${name}=${value}`;
          }
        },
      },
    });

    try {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const header = Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64url");
      const payload = Buffer.from(JSON.stringify({ sub: "usr-cookie", exp: futureExp })).toString("base64url");
      const token = `${header}.${payload}.sig`;

      setClientAuthCookie(token);
      assert.equal(getClientAuthCookie(), token);
      assert.ok(cookieWrites.some((c) => c.includes("SameSite=Lax; Secure")));

      clearClientAuthCookie();
      assert.equal(getClientAuthCookie(), null);
      assert.ok(cookieWrites.some((c) => c.includes("Max-Age=0; path=/; SameSite=Lax; Secure")));
    } finally {
      Object.defineProperty(globalThis, "document", {
        configurable: true,
        value: originalDocument,
      });
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: originalWindow,
      });
    }
  });
});
