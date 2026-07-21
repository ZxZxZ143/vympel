import {describe, expect, it, vi} from "vitest";
import {createTelemetryDeduper, normalizeTelemetryRoute, reportTelemetry, sanitizeTelemetryEvent, sanitizeTelemetryText} from "@/shared/telemetry/telemetry";

describe("CRM telemetry privacy", () => {
  it("redacts identity, tokens, and query strings", () => {
    expect(sanitizeTelemetryText("manager@example.com +7 777 123 45 67 10.0.0.1 2001:db8::1 Authorization:Bearer-secret password=hunter2 https://x.test/p?token=secret"))
      .toBe("[redacted-email] [redacted-phone] [redacted-ip] [redacted-ip] Authorization=[redacted] password=[redacted] https://x.test/p");
    expect(normalizeTelemetryRoute("/products/123?email=manager@example.com")).toBe("/products/:id");
  });

  it("rejects unknown kinds and never preserves arbitrary identity fields", () => {
    expect(sanitizeTelemetryEvent({kind: "session_replay", userId: 42})).toBeNull();
    expect(sanitizeTelemetryEvent({kind: "api_error", userId: 42}))
      .toEqual(expect.not.objectContaining({userId: 42}));
  });

  it("is disabled by default and samples only web vitals", () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(undefined));
    expect(reportTelemetry({kind: "runtime_error"}, {enabled: false, sampleRate: 1})).toBe(false);
    expect(reportTelemetry({kind: "web_vital"}, {enabled: true, sampleRate: 0, random: () => 0.5})).toBe(false);
    expect(reportTelemetry({kind: "runtime_error"}, {enabled: true, sampleRate: 0, random: () => 0.5})).toBe(true);
    vi.unstubAllGlobals();
  });

  it("deduplicates a client failure and ignores collector rejection", () => {
    const isFirst = createTelemetryDeduper();
    const event = {kind: "runtime_error" as const, name: "Error", message: "boom", route: "/products"};
    expect(isFirst(event)).toBe(true);
    expect(isFirst(event)).toBe(false);
    vi.stubGlobal("window", {});
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(() => reportTelemetry(event, {enabled: true, sampleRate: 1})).not.toThrow();
    vi.unstubAllGlobals();
  });
});
