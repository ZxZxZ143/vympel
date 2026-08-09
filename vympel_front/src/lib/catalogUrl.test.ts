import {describe, expect, it} from "vitest";

import {catalogHrefFromPolicy, classifyCatalogUrl} from "./catalogUrl";

describe("catalog URL policy", () => {
    it.each([
        [undefined, "", "/catalog", "", true],
        ["WATCH_WRIST", "page=2", "/catalog/WATCH_WRIST", "page=2", true],
        ["WATCH WRIST", "page=1&sort=priceAsc", "/catalog/WATCH%20WRIST", "", true],
        ["WATCH_WRIST", "sort=priceDesc&page=2", "/catalog/WATCH_WRIST", "page=2&sort=priceDesc", false],
        ["WATCH_WRIST", "search=test&brand=2&brand=1", "/catalog/WATCH_WRIST", "brand=1&brand=2&search=test", false],
    ])("classifies %s?%s", (category, search, path, normalized, indexable) => {
        const policy = classifyCatalogUrl(category, new URLSearchParams(search));
        expect(policy.path).toBe(path);
        expect(policy.normalizedSearch).toBe(normalized);
        expect(policy.indexable).toBe(indexable);
        expect(catalogHrefFromPolicy(policy)).toBe(normalized ? `${path}?${normalized}` : path);
    });

    it("converts legacy query categories to the canonical path and keeps allowed state", () => {
        const policy = classifyCatalogUrl(undefined, new URLSearchParams("categoryCode=WATCH_WRIST&page=1&search=moon&size=60"));
        expect(policy.legacyCategory).toBe(true);
        expect(catalogHrefFromPolicy(policy)).toBe("/catalog/WATCH_WRIST?search=moon");
        expect(policy.canonicalSearch).toBe("");
        expect(policy.indexable).toBe(false);
    });
});
