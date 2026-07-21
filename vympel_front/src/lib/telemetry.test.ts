import {describe, expect, it, vi} from "vitest";
import {createTelemetryDeduper, normalizeTelemetryRoute, reportTelemetry, sanitizeTelemetryEvent, sanitizeTelemetryText} from "@/lib/telemetry";

describe("storefront telemetry privacy", () => {
    it("redacts identity, tokens, and query strings", () => {
        expect(sanitizeTelemetryText("person@example.com +7 777 123 45 67 192.168.1.10 2001:db8::1 Cookie:session=abc password=hunter2 https://x.test/p?token=secret"))
            .toBe("[redacted-email] [redacted-phone] [redacted-ip] [redacted-ip] Cookie=[redacted] password=[redacted] https://x.test/p");
        expect(normalizeTelemetryRoute("https://x.test/product/123?email=person@example.com"))
            .toBe("/product/:id");
    });

    it("rejects unknown event kinds and strips unsupported fields", () => {
        expect(sanitizeTelemetryEvent({kind: "session_replay", userId: 42})).toBeNull();
        expect(sanitizeTelemetryEvent({kind: "api_error", route: "/product/42", userId: 42}))
            .toEqual(expect.not.objectContaining({userId: 42}));
    });

    it("is a true no-op while disabled", () => {
        vi.stubGlobal("window", {});
        vi.stubGlobal("fetch", vi.fn());
        expect(reportTelemetry({kind: "runtime_error"}, {enabled: false, sampleRate: 1})).toBe(false);
        expect(fetch).not.toHaveBeenCalled();
        vi.unstubAllGlobals();
    });

    it("samples web vitals without sampling error events", () => {
        vi.stubGlobal("window", {});
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(undefined));
        expect(reportTelemetry({kind: "web_vital"}, {enabled: true, sampleRate: 0, random: () => 0.5})).toBe(false);
        expect(reportTelemetry({kind: "runtime_error"}, {enabled: true, sampleRate: 0, random: () => 0.5})).toBe(true);
        vi.unstubAllGlobals();
    });

    it("deduplicates one runtime failure and tolerates collector failure", () => {
        const isFirst = createTelemetryDeduper();
        const event = {kind: "runtime_error" as const, name: "Error", message: "boom", route: "/catalog"};
        expect(isFirst(event)).toBe(true);
        expect(isFirst(event)).toBe(false);

        vi.stubGlobal("window", {});
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("collector offline")));
        expect(() => reportTelemetry(event, {enabled: true, sampleRate: 1})).not.toThrow();
        vi.unstubAllGlobals();
    });
});
