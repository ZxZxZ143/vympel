type RequestErrorContext = {
    routerKind: string;
    routePath: string;
    routeType: string;
    renderSource?: string;
    revalidateReason?: string;
};

export function serverErrorRecord(
    error: unknown,
    request: {path: string; method: string},
    context: RequestErrorContext,
) {
    const candidate = error instanceof Error ? error : null;
    const digest = candidate && "digest" in candidate && typeof candidate.digest === "string"
        ? sanitize(candidate.digest)
        : undefined;
    return {
        event: "frontend_server_request_error",
        service: "vympel-storefront",
        release: process.env.NEXT_PUBLIC_APP_RELEASE ?? "unknown",
        errorType: sanitize(candidate?.name ?? "UnknownError"),
        digest,
        method: sanitize(request.method),
        path: sanitize(request.path),
        routerKind: sanitize(context.routerKind),
        routePath: sanitize(context.routePath),
        routeType: sanitize(context.routeType),
    };
}

function sanitize(value: string): string {
    return value.replace(/[\r\n\t]/g, "_").slice(0, 256);
}
