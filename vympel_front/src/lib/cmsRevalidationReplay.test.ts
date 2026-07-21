import {describe, expect, it} from "vitest";

import {consumeCmsRevalidationRequest, type CmsRevalidationReplayEntry} from "./cmsRevalidationReplay";

const payload = {
    version: "1" as const,
    timestamp: 1_000,
    requestId: "87c8f5c4-6554-4ab7-8fb0-25c51f7dd90c",
    pageKey: "home" as const,
};

describe("consumeCmsRevalidationRequest", () => {
    it("accepts the first request and treats a re-signed retry as idempotent", () => {
        const window = new Map<string, CmsRevalidationReplayEntry>();

        expect(consumeCmsRevalidationRequest(window, payload, 1_000)).toBe("NEW");
        expect(consumeCmsRevalidationRequest(window, {...payload, timestamp: 1_001}, 1_001)).toBe("IDEMPOTENT");
    });

    it("rejects reuse of a request ID with different signed payload data", () => {
        const window = new Map<string, CmsRevalidationReplayEntry>();
        consumeCmsRevalidationRequest(window, payload, 1_000);

        expect(consumeCmsRevalidationRequest(window, {...payload, pageKey: "about"}, 1_001)).toBe("REJECTED");
    });

    it("evicts expired and oldest entries without weakening the active window", () => {
        const window = new Map<string, CmsRevalidationReplayEntry>([
            ["expired", {expiresAt: 999, fingerprint: "old"}],
        ]);

        expect(consumeCmsRevalidationRequest(window, payload, 1_000, 1)).toBe("NEW");
        expect(window.has("expired")).toBe(false);
    });
});
