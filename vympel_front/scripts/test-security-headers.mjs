import assert from "node:assert/strict";
import test from "node:test";
import {buildContentSecurityPolicy, buildSecurityHeaders} from "../security-headers.mjs";

test("production CSP is enforced and excludes unsafe-eval and wildcards", () => {
    const headers = buildSecurityHeaders({
        NODE_ENV: "production",
        NEXT_PUBLIC_BASE_API_PUBLIC: "https://api.vympel.example/api/public",
        NEXT_PUBLIC_MEDIA_ORIGINS: "https://media.vympel.example",
    });
    const csp = headers.find((header) => header.key === "Content-Security-Policy");

    assert.ok(csp);
    assert.match(csp.value, /connect-src 'self' https:\/\/api\.vympel\.example/);
    assert.match(csp.value, /img-src[^;]+https:\/\/media\.vympel\.example/);
    assert.doesNotMatch(csp.value, /unsafe-eval|\*/);
    assert.equal(headers.find((header) => header.key === "X-Frame-Options")?.value, "DENY");
});

test("report-only mode is explicit and never leaves an enforcing duplicate", () => {
    const headers = buildSecurityHeaders({NODE_ENV: "production", SECURITY_HEADERS_CSP_MODE: "report-only"});
    assert.ok(headers.some((header) => header.key === "Content-Security-Policy-Report-Only"));
    assert.ok(!headers.some((header) => header.key === "Content-Security-Policy"));
});

test("development-only unsafe-eval does not leak into production", () => {
    assert.match(buildContentSecurityPolicy({NODE_ENV: "development"}), /unsafe-eval/);
    assert.doesNotMatch(buildContentSecurityPolicy({NODE_ENV: "production"}), /unsafe-eval/);
});
