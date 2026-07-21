import {describe, expect, it, vi} from "vitest";

import {parseError, parseRetryAfter} from "@/api/ErrorParser";

describe("public API rate-limit errors", () => {
    it("preserves request id and retry timing from the safe error envelope", async () => {
        const error = await parseError(new Response(JSON.stringify({
            status: 429,
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests.",
            requestId: "request-429",
            retryAfterSeconds: 37,
        }), {
            status: 429,
            headers: {"Content-Type": "application/json", "Retry-After": "99"},
        }));

        expect(error).toMatchObject({status: 429, requestId: "request-429", retryAfterSeconds: 37});
    });

    it("supports Retry-After seconds and HTTP dates", () => {
        expect(parseRetryAfter("12")).toBe(12);
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-07-16T00:00:00Z"));
        expect(parseRetryAfter("Thu, 16 Jul 2026 00:00:10 GMT")).toBe(10);
        vi.useRealTimers();
    });
});
