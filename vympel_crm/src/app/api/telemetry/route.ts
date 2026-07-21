import {NextResponse} from "next/server";
import {sanitizeTelemetryEvent, sanitizeTelemetryText} from "@/shared/telemetry/telemetry";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (process.env.TELEMETRY_ENABLED !== "true") return new NextResponse(null, {status: 204});
  if (Number(request.headers.get("content-length") ?? "0") > 16_384) {
    return NextResponse.json({error: "payload_too_large"}, {status: 413});
  }
  const raw = await request.text();
  if (raw.length > 16_384) return NextResponse.json({error: "payload_too_large"}, {status: 413});
  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch {
    return NextResponse.json({error: "invalid_json"}, {status: 400});
  }
  const source = input as Record<string, unknown>;
  const event = sanitizeTelemetryEvent(source);
  if (!event) return NextResponse.json({error: "invalid_event"}, {status: 400});

  console.info("client_telemetry", JSON.stringify({
    application: "crm",
    environment: sanitizeTelemetryText(source.environment, 40),
    release: sanitizeTelemetryText(source.release, 80),
    occurredAt: sanitizeTelemetryText(source.occurredAt, 40),
    ...event,
  }));
  return new NextResponse(null, {status: 204});
}
