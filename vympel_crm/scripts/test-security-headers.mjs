import assert from "node:assert/strict";
import test from "node:test";
import { buildContentSecurityPolicy, buildSecurityHeaders } from "../security-headers.mjs";

test("production CRM CSP is enforced with only configured origins", () => {
  const headers = buildSecurityHeaders({
    NODE_ENV: "production",
    NEXT_PUBLIC_CRM_API_BASE: "https://api.vympel.example/api/crm",
    NEXT_PUBLIC_MEDIA_ORIGINS: "https://media.vympel.example",
  });
  const csp = headers.find((header) => header.key === "Content-Security-Policy");
  assert.ok(csp);
  assert.match(csp.value, /connect-src 'self' https:\/\/api\.vympel\.example/);
  assert.doesNotMatch(csp.value, /unsafe-eval|\*/);
  assert.equal(headers.find((header) => header.key === "X-Content-Type-Options")?.value, "nosniff");
});

test("CRM report-only mode is an explicit rollout switch", () => {
  const headers = buildSecurityHeaders({ NODE_ENV: "production", SECURITY_HEADERS_CSP_MODE: "report-only" });
  assert.ok(headers.some((header) => header.key === "Content-Security-Policy-Report-Only"));
  assert.ok(!headers.some((header) => header.key === "Content-Security-Policy"));
});

test("development-only unsafe-eval does not leak into production", () => {
  assert.match(buildContentSecurityPolicy({ NODE_ENV: "development" }), /unsafe-eval/);
  assert.doesNotMatch(buildContentSecurityPolicy({ NODE_ENV: "production" }), /unsafe-eval/);
});
