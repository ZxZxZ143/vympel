import {revalidatePath, revalidateTag} from "next/cache";
import {NextRequest, NextResponse} from "next/server";

import {
    CMS_REVALIDATION_MAX_BODY_BYTES,
    cmsRevalidationTargets,
    validateCmsRevalidationPayload,
    verifyCmsRevalidationSignature,
    type CmsRevalidationPayload,
} from "@/lib/cmsRevalidation";
import {
    consumeCmsRevalidationRequest,
    type CmsRevalidationReplayEntry,
} from "@/lib/cmsRevalidationReplay";

export const runtime = "nodejs";

const replayWindow = new Map<string, CmsRevalidationReplayEntry>();

export async function POST(request: NextRequest) {
    const configuredSecret = process.env.CMS_REVALIDATE_SECRET;
    if (!configuredSecret) {
        return json({ok: false, status: "NOT_CONFIGURED"}, 503);
    }

    const declaredLength = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(declaredLength) && declaredLength > CMS_REVALIDATION_MAX_BODY_BYTES) {
        return json({ok: false, error: "Payload too large"}, 413);
    }

    let rawBody: string;
    try {
        rawBody = await request.text();
    } catch {
        return json({ok: false, error: "Invalid request body"}, 400);
    }
    if (Buffer.byteLength(rawBody, "utf8") > CMS_REVALIDATION_MAX_BODY_BYTES) {
        return json({ok: false, error: "Payload too large"}, 413);
    }

    let payload: CmsRevalidationPayload;
    try {
        payload = JSON.parse(rawBody) as CmsRevalidationPayload;
    } catch {
        return json({ok: false, error: "Invalid JSON payload"}, 400);
    }

    const validated = validateCmsRevalidationPayload(payload);
    if (!validated.ok) {
        return json({ok: false, error: validated.error}, 400);
    }
    if (!verifyCmsRevalidationSignature(
        configuredSecret,
        request.headers.get("x-cms-signature"),
        validated.value,
    )) {
        return json({ok: false, error: "Unauthorized"}, 401);
    }
    const replayResult = consumeCmsRevalidationRequest(replayWindow, validated.value);
    if (replayResult === "REJECTED") {
        return json({ok: false, error: "Replay rejected"}, 409);
    }
    if (replayResult === "IDEMPOTENT") {
        return json({
            ok: true,
            status: "ALREADY_REVALIDATED",
            pageKey: validated.value.pageKey,
            requestId: validated.value.requestId,
        });
    }

    const tag = `cms:${validated.value.pageKey}`;
    revalidateTag(tag, {expire: 0});
    const targets = cmsRevalidationTargets(validated.value.pageKey);
    for (const target of targets) {
        if (target.type) {
            revalidatePath(target.path, target.type);
        } else {
            revalidatePath(target.path);
        }
    }

    return json({
        ok: true,
        status: "REVALIDATED",
        pageKey: validated.value.pageKey,
        revalidatedTags: [tag],
        requestId: validated.value.requestId,
        revalidatedAt: new Date().toISOString(),
    });
}

function json(body: Record<string, unknown>, status = 200) {
    return NextResponse.json(body, {
        status,
        headers: {
            "Cache-Control": "no-store",
        },
    });
}
