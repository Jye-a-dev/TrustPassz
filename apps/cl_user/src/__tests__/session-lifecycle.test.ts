import test from "node:test";
import assert from "node:assert/strict";
import { parseJwtPayload, isTokenExpired, validateEdgeToken } from "../lib/jwt-edge";

test("JWT Edge Session & Expiry Protocol Tests", async (t) => {
  await t.test("should parse base64url JWT payload correctly without external dependencies", () => {
    // Standard mock token: header {"alg":"none"}, payload {"sub":"usr-123","role":"USER","exp":1893456000}
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

    // Expired 100s ago
    assert.equal(isTokenExpired(nowSec - 100, 15), true);

    // Expires in 5s (within 15s buffer -> treated as expired for proactive logout)
    assert.equal(isTokenExpired(nowSec + 5, 15), true);

    // Expires in 60s (safe -> not expired)
    assert.equal(isTokenExpired(nowSec + 60, 15), false);
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
});
