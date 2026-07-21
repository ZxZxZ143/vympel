import type {ValidatedCmsRevalidationPayload} from "@/lib/cmsRevalidation";

export type CmsRevalidationReplayEntry = {
    expiresAt: number;
    fingerprint: string;
};

export type CmsRevalidationReplayResult = "NEW" | "IDEMPOTENT" | "REJECTED";

export function consumeCmsRevalidationRequest(
    replayWindow: Map<string, CmsRevalidationReplayEntry>,
    payload: ValidatedCmsRevalidationPayload,
    nowSeconds = Math.floor(Date.now() / 1000),
    maxEntries = 1_000,
): CmsRevalidationReplayResult {
    for (const [storedId, entry] of replayWindow) {
        if (entry.expiresAt < nowSeconds) replayWindow.delete(storedId);
    }

    // The backend intentionally re-signs a retry with a fresh timestamp while
    // retaining the operation request ID. Page identity must remain stable.
    const fingerprint = `${payload.version}\n${payload.pageKey}`;
    const existing = replayWindow.get(payload.requestId);
    if (existing) {
        return existing.fingerprint === fingerprint ? "IDEMPOTENT" : "REJECTED";
    }

    if (replayWindow.size >= maxEntries) {
        const oldest = replayWindow.keys().next().value;
        if (oldest) replayWindow.delete(oldest);
    }
    replayWindow.set(payload.requestId, {
        expiresAt: payload.timestamp + 300,
        fingerprint,
    });
    return "NEW";
}
