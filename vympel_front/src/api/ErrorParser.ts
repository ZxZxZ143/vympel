import {ApiError} from "@/api/types/ApiError";
import {reportTelemetry} from "@/lib/telemetry";

export async function parseError(res: Response): Promise<ApiError> {
    const contentType = res.headers.get("content-type") || "";
    let body: unknown = null;

    if (contentType.includes("application/json")) {
        try {
            body = await res.json();
        } catch {
            body = null;
        }
    } else {
        try {
            body = await res.text();
        } catch {
            body = null;
        }
    }

    const message =
        typeof body === "object" && body !== null && "message" in body
            ? String(body.message)
            : typeof body === "object" && body !== null && "error" in body
                ? String(body.error)
                : typeof body === "string" && body.trim()
                    ? body
                    : "Request failed";
    const requestId =
        typeof body === "object" && body !== null && "requestId" in body
            ? String(body.requestId)
            : res.headers.get("x-request-id") ?? undefined;
    const bodyRetryAfter =
        typeof body === "object" && body !== null && "retryAfterSeconds" in body
            ? Number(body.retryAfterSeconds)
            : Number.NaN;
    const retryAfterSeconds = Number.isFinite(bodyRetryAfter) && bodyRetryAfter > 0
        ? Math.min(86400, Math.ceil(bodyRetryAfter))
        : parseRetryAfter(res.headers.get("retry-after"));

    const error = new ApiError(res.status, message, body, requestId, retryAfterSeconds);
    if (res.status >= 500) {
        reportTelemetry({
            kind: "api_error",
            name: "ApiError",
            message,
            requestId,
            status: res.status,
            route: res.url,
            locale: typeof document === "undefined" ? undefined : document.documentElement.lang,
        });
    }
    return error;
}

export function parseRetryAfter(value: string | null): number | undefined {
    if (!value) return undefined;

    const seconds = Number(value);
    if (Number.isFinite(seconds) && seconds > 0) {
        return Math.min(86400, Math.ceil(seconds));
    }

    const date = Date.parse(value);
    if (!Number.isNaN(date)) {
        return Math.min(86400, Math.max(1, Math.ceil((date - Date.now()) / 1000)));
    }
    return undefined;
}
