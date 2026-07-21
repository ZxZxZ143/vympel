import {describe, expect, it} from "vitest";

import {
    CMS_REVALIDATION_VERSION,
    cmsRevalidationTargets,
    signCmsRevalidationPayload,
    type ValidatedCmsRevalidationPayload,
    validateCmsRevalidationPayload,
    verifyCmsRevalidationSignature,
} from "./cmsRevalidation";

const payload: ValidatedCmsRevalidationPayload = {
    version: CMS_REVALIDATION_VERSION,
    timestamp: 1_700_000_000,
    requestId: "de305d54-75b4-431b-adb2-eb6b9e546014",
    pageKey: "catalog" as const,
};

describe("CMS revalidation contract", () => {
    it("accepts the canonical HMAC and rejects a different secret", () => {
        const signature = signCmsRevalidationPayload("correct-secret", payload);

        expect(verifyCmsRevalidationSignature("correct-secret", signature, payload)).toBe(true);
        expect(verifyCmsRevalidationSignature("wrong-secret", signature, payload)).toBe(false);
    });

    it("rejects unknown page keys and expired requests", () => {
        expect(validateCmsRevalidationPayload({...payload, pageKey: "arbitrary"}, payload.timestamp)).toEqual({
            ok: false,
            error: "Invalid pageKey",
        });
        expect(validateCmsRevalidationPayload(payload, payload.timestamp + 301)).toEqual({
            ok: false,
            error: "Expired request",
        });
    });

    it("maps CMS keys only to allow-listed route patterns", () => {
        const catalogTargets = cmsRevalidationTargets("catalog");
        const productTargets = cmsRevalidationTargets("product");

        expect(catalogTargets).toContainEqual({path: "/ru/catalog/[...slug]", type: "page"});
        expect(productTargets).toContainEqual({path: "/en/product/[id]", type: "page"});
        expect(catalogTargets.some((target) => /\/\.\.(\/|$)/.test(target.path))).toBe(false);
    });
});
