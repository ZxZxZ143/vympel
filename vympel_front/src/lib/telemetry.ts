export type TelemetryKind = "runtime_error" | "react_boundary" | "api_error" | "web_vital";

export type TelemetryEvent = {
    kind: TelemetryKind;
    name?: string;
    message?: string;
    requestId?: string;
    status?: number;
    route?: string;
    locale?: string;
    deviceClass?: "mobile" | "tablet" | "desktop";
    value?: number;
    rating?: string;
};

type ReporterConfig = {
    enabled: boolean;
    sampleRate: number;
    random?: () => number;
};

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE = /(?:\+?\d[\d\s().-]{7,}\d)/g;
const JWT = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;
const SECRET = /\b(?:bearer\s+)?[A-Za-z0-9_-]{32,}\b/gi;
const SENSITIVE_FIELD = /\b(authorization|cookie|set-cookie|password|access[_-]?token|refresh[_-]?token|review[_-]?text|request[_-]?text)\s*[:=]\s*[^\s,;]+/gi;
const IPV4 = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const IPV6 = /(?<![A-Za-z0-9])(?:[A-F0-9]{0,4}:){2,7}[A-F0-9]{0,4}(?![A-Za-z0-9])/gi;
const UUID_SEGMENT = /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i;

export function sanitizeTelemetryText(value: unknown, maxLength = 240): string | undefined {
    if (typeof value !== "string" || !value.trim()) return undefined;
    return value
        .replace(EMAIL, "[redacted-email]")
        .replace(IPV4, "[redacted-ip]")
        .replace(IPV6, "[redacted-ip]")
        .replace(PHONE, "[redacted-phone]")
        .replace(JWT, "[redacted-token]")
        .replace(SECRET, "[redacted-secret]")
        .replace(SENSITIVE_FIELD, "$1=[redacted]")
        .replace(/https?:\/\/[^\s]+/gi, (url) => {
            try {
                const parsed = new URL(url);
                return `${parsed.origin}${parsed.pathname}`;
            } catch {
                return "[redacted-url]";
            }
        })
        .slice(0, maxLength);
}

export function createTelemetryDeduper(limit = 100) {
    const seen = new Set<string>();
    return (event: TelemetryEvent) => {
        const key = `${event.kind}:${event.name ?? ""}:${event.message ?? ""}:${event.route ?? ""}`;
        if (seen.has(key)) return false;
        if (seen.size >= limit) seen.clear();
        seen.add(key);
        return true;
    };
}

export function normalizeTelemetryRoute(value: unknown): string {
    if (typeof value !== "string" || !value.trim()) return "/unknown";
    let pathname = value;
    try {
        pathname = new URL(value, "https://telemetry.invalid").pathname;
    } catch {
        pathname = value.split(/[?#]/, 1)[0];
    }
    const segments = pathname.split("/").filter(Boolean).map((segment) => {
        if (/^\d+$/.test(segment) || UUID_SEGMENT.test(segment)) return ":id";
        return segment.slice(0, 80);
    });
    return `/${segments.join("/")}`.slice(0, 240) || "/";
}

export function sanitizeTelemetryEvent(input: unknown): TelemetryEvent | null {
    if (!input || typeof input !== "object") return null;
    const source = input as Record<string, unknown>;
    if (!(["runtime_error", "react_boundary", "api_error", "web_vital"] as const).includes(source.kind as TelemetryKind)) {
        return null;
    }
    const status = typeof source.status === "number" && source.status >= 100 && source.status <= 599
        ? Math.trunc(source.status)
        : undefined;
    const value = typeof source.value === "number" && Number.isFinite(source.value)
        ? Math.round(source.value * 1000) / 1000
        : undefined;
    return {
        kind: source.kind as TelemetryKind,
        name: sanitizeTelemetryText(source.name, 80),
        message: sanitizeTelemetryText(source.message),
        requestId: sanitizeTelemetryText(source.requestId, 128),
        status,
        route: normalizeTelemetryRoute(source.route),
        locale: typeof source.locale === "string" && /^(ru|kz|en)$/.test(source.locale) ? source.locale : undefined,
        deviceClass: source.deviceClass === "mobile" || source.deviceClass === "tablet" || source.deviceClass === "desktop"
            ? source.deviceClass
            : undefined,
        value,
        rating: sanitizeTelemetryText(source.rating, 24),
    };
}

export function shouldSample(sampleRate: number, random = Math.random): boolean {
    const bounded = Math.max(0, Math.min(1, Number.isFinite(sampleRate) ? sampleRate : 0));
    return random() < bounded;
}

export function reportTelemetry(input: TelemetryEvent, config: ReporterConfig = {
    enabled: process.env.NEXT_PUBLIC_TELEMETRY_ENABLED === "true",
    sampleRate: Number(process.env.NEXT_PUBLIC_TELEMETRY_SAMPLE_RATE ?? "0.1"),
}) {
    if (!config.enabled || typeof window === "undefined") return false;
    if (input.kind === "web_vital" && !shouldSample(config.sampleRate, config.random)) return false;
    const event = sanitizeTelemetryEvent(input);
    if (!event) return false;

    const envelope = JSON.stringify({
        application: "storefront",
        environment: sanitizeTelemetryText(process.env.NEXT_PUBLIC_APP_ENV ?? "unknown", 40),
        release: sanitizeTelemetryText(process.env.NEXT_PUBLIC_APP_RELEASE ?? "unknown", 80),
        occurredAt: new Date().toISOString(),
        ...event,
    });
    if (envelope.length > 8_192) return false;
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        return navigator.sendBeacon("/api/telemetry", new Blob([envelope], {type: "application/json"}));
    }
    void fetch("/api/telemetry", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: envelope,
        keepalive: true,
    }).catch(() => undefined);
    return true;
}
