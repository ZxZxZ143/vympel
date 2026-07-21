const BASE_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

function configuredOrigins(values) {
  return Array.from(new Set(values.flatMap((value) => {
    if (!value) return [];
    return value.split(",").flatMap((candidate) => {
      try {
        return [new URL(candidate.trim()).origin];
      } catch {
        return [];
      }
    });
  })));
}

function reportUri(value) {
  if (!value) return null;
  if (value.startsWith("/")) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function buildContentSecurityPolicy(env = process.env) {
  const production = env.NODE_ENV === "production";
  const apiOrigins = configuredOrigins([env.NEXT_PUBLIC_CRM_API_BASE]);
  const mediaOrigins = configuredOrigins([env.NEXT_PUBLIC_MEDIA_ORIGINS, ...apiOrigins]);
  const scriptSources = ["'self'", "'unsafe-inline'"];
  const connectSources = ["'self'", ...apiOrigins];
  if (!production) {
    scriptSources.push("'unsafe-eval'");
    connectSources.push("http://localhost:*", "ws://localhost:*");
  }

  const directives = [
    ["default-src", "'self'"],
    ["base-uri", "'self'"],
    ["form-action", "'self'"],
    ["frame-ancestors", "'none'"],
    ["object-src", "'none'"],
    ["script-src", ...scriptSources],
    ["style-src", "'self'", "'unsafe-inline'"],
    ["font-src", "'self'", "data:"],
    ["img-src", "'self'", "data:", "blob:", ...mediaOrigins],
    ["connect-src", ...connectSources],
    ["media-src", "'self'", "blob:"],
    ["worker-src", "'self'", "blob:"],
    ["manifest-src", "'self'"],
  ];
  const configuredReportUri = reportUri(env.SECURITY_HEADERS_CSP_REPORT_URI);
  if (configuredReportUri) directives.push(["report-uri", configuredReportUri]);
  return directives.map((directive) => directive.join(" ")).join("; ");
}

export function buildSecurityHeaders(env = process.env) {
  const reportOnly = env.SECURITY_HEADERS_CSP_MODE === "report-only";
  return [
    ...BASE_HEADERS,
    {
      key: reportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy",
      value: buildContentSecurityPolicy(env),
    },
  ];
}
