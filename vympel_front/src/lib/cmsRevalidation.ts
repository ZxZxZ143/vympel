import {createHmac, timingSafeEqual} from "node:crypto";

import {PUBLIC_BRANDS} from "@/config/brandRoutes";

export const CMS_REVALIDATION_VERSION = "1";
export const CMS_REVALIDATION_MAX_BODY_BYTES = 4096;
export const CMS_REVALIDATION_MAX_SKEW_SECONDS = 300;

const locales = ["ru", "kz", "en"] as const;
const pageKeys = ["home", "about", "catalog", "product", "brands"] as const;
const requestIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type CmsRevalidationPageKey = (typeof pageKeys)[number];

export type CmsRevalidationPayload = {
    version?: unknown;
    timestamp?: unknown;
    requestId?: unknown;
    pageKey?: unknown;
};

export type ValidatedCmsRevalidationPayload = {
    version: typeof CMS_REVALIDATION_VERSION;
    timestamp: number;
    requestId: string;
    pageKey: CmsRevalidationPageKey;
};

export function validateCmsRevalidationPayload(
    payload: CmsRevalidationPayload,
    nowSeconds = Math.floor(Date.now() / 1000),
): {ok: true; value: ValidatedCmsRevalidationPayload} | {ok: false; error: string} {
    if (payload.version !== CMS_REVALIDATION_VERSION) {
        return {ok: false, error: "Unsupported signature version"};
    }
    if (!Number.isSafeInteger(payload.timestamp)) {
        return {ok: false, error: "Invalid timestamp"};
    }
    const timestamp = payload.timestamp as number;
    if (Math.abs(nowSeconds - timestamp) > CMS_REVALIDATION_MAX_SKEW_SECONDS) {
        return {ok: false, error: "Expired request"};
    }
    if (typeof payload.requestId !== "string" || !requestIdPattern.test(payload.requestId)) {
        return {ok: false, error: "Invalid requestId"};
    }
    if (typeof payload.pageKey !== "string" || !pageKeys.includes(payload.pageKey as CmsRevalidationPageKey)) {
        return {ok: false, error: "Invalid pageKey"};
    }
    return {
        ok: true,
        value: {
            version: CMS_REVALIDATION_VERSION,
            timestamp,
            requestId: payload.requestId,
            pageKey: payload.pageKey as CmsRevalidationPageKey,
        },
    };
}

export function verifyCmsRevalidationSignature(
    secret: string,
    signature: string | null,
    payload: ValidatedCmsRevalidationPayload,
) {
    if (!signature || !/^[0-9a-f]{64}$/i.test(signature)) {
        return false;
    }
    const expected = createHmac("sha256", secret)
        .update(canonicalPayload(payload))
        .digest();
    const supplied = Buffer.from(signature, "hex");
    return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export function signCmsRevalidationPayload(
    secret: string,
    payload: ValidatedCmsRevalidationPayload,
) {
    return createHmac("sha256", secret)
        .update(canonicalPayload(payload))
        .digest("hex");
}

export function cmsRevalidationTargets(
    pageKey: CmsRevalidationPageKey,
): Array<{path: string; type?: "page" | "layout"}> {
    const targets: Array<{path: string; type?: "page" | "layout"}> = [];
    if (pageKey === "home") {
        return [
            {path: "/"},
            ...locales.map((locale) => ({path: `/${locale}`})),
        ];
    }
    if (pageKey === "about") {
        return locales.map((locale) => ({path: `/${locale}/about`}));
    }
    if (pageKey === "catalog") {
        for (const locale of locales) {
            targets.push({path: `/${locale}/catalog`});
            targets.push({path: `/${locale}/catalog/[...slug]`, type: "page"});
        }
        return targets;
    }
    if (pageKey === "product") {
        return locales.map((locale) => ({path: `/${locale}/product/[id]`, type: "page"}));
    }
    for (const locale of locales) {
        targets.push({path: `/${locale}/brands`});
        targets.push(...PUBLIC_BRANDS.map((brand) => ({path: `/${locale}/brands/${brand.slug}`})));
    }
    return targets;
}

function canonicalPayload(payload: ValidatedCmsRevalidationPayload) {
    return `${payload.version}\n${payload.timestamp}\n${payload.requestId}\n${payload.pageKey}`;
}
