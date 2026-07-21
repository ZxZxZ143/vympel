export function crmServerErrorRecord(
  error: unknown,
  request: {path: string; method: string},
  context: {routerKind: string; routePath: string; routeType: string},
) {
  const candidate = error instanceof Error ? error : null;
  return {
    event: "frontend_server_request_error",
    service: "vympel-crm",
    release: process.env.NEXT_PUBLIC_APP_RELEASE ?? "unknown",
    errorType: sanitize(candidate?.name ?? "UnknownError"),
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
