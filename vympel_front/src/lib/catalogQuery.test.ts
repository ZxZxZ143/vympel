import {describe, expect, it} from "vitest";

import {LocaleEnum} from "@/i18n/routing";
import {catalogRequestParams, toUrlSearchParams} from "./catalogQuery";

describe("catalog server request normalization", () => {
    it("maps one-based URLs to the existing backend request contract", () => {
        const params = catalogRequestParams(
            LocaleEnum.EN,
            "WATCH_WRIST",
            new URLSearchParams("page=2&sort=newest&search=moon&brand=2&brand=1&size=99"),
        );
        expect(params).toMatchObject({
            page: 1,
            size: 9,
            categoryCode: "WATCH_WRIST",
            sort: "newest",
            search: "moon",
            filters: {brand: ["2", "1"]},
        });
    });

    it("converts Next search-param arrays without dropping duplicates before policy normalization", () => {
        expect(toUrlSearchParams({brand: ["2", "1"], page: "2"}).getAll("brand")).toEqual(["2", "1"]);
    });
});

import {catalogSortSearch, effectiveCatalogSort} from "./catalogSort";
import {classifyCatalogUrl} from "./catalogUrl";
import {paginationHref} from "./paginationUrl";

describe("search ordering policy shared by SSR and client retry", () => {
    it.each([
        ["", "priceAsc"], ["search=romanson", undefined], ["search=%20", "priceAsc"],
        ["search=romanson&sort=priceAsc", "priceAsc"], ["search=romanson&sort=newest", "newest"],
        ["sort=priceDesc", "priceDesc"], ["search=romanson&sort=undefined", undefined],
    ])("resolves %s", (query, sort) => {
        const params = new URLSearchParams(query);
        expect(effectiveCatalogSort(params)).toBe(sort);
        expect(catalogRequestParams(LocaleEnum.RU, undefined, params).sort).toBe(sort);
        const normalized = classifyCatalogUrl(undefined, params);
        expect(catalogRequestParams(LocaleEnum.RU, undefined, new URLSearchParams(normalized.normalizedSearch)).sort).toBe(sort);
        expect(classifyCatalogUrl(undefined, new URLSearchParams(normalized.normalizedSearch)).redirectRequired).toBe(false);
    });
    it("clears only sorting and page, preserves search and repeated facets", () => {
        const query = new URLSearchParams("search=romanson&sort=priceAsc&page=3&brand=1&brand=2&priceMin=10");
        const cleared = catalogSortSearch(query);
        expect(cleared.toString()).toBe("search=romanson&brand=1&brand=2&priceMin=10");
        expect(effectiveCatalogSort(cleared)).toBeUndefined();
        expect(catalogSortSearch(query, "newest").get("page")).toBeNull();
        expect(query.get("page")).toBe("3");
    });
    it("preserves state and list anchor while normalizing the first page", () => {
        const query = new URLSearchParams("search=romanson&sort=priceAsc&brand=1&brand=2&page=3&size=15");
        expect(paginationHref("/catalog/WATCH_WRIST", query, 1, "catalog-product-list"))
            .toBe("/catalog/WATCH_WRIST?search=romanson&sort=priceAsc&brand=1&brand=2#catalog-product-list");
        expect(catalogRequestParams(LocaleEnum.KZ, "ACCESSORY", new URLSearchParams("page=4")).page).toBe(3);
    });
});
