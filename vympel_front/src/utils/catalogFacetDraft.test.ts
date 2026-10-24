import {describe, expect, it} from "vitest";
import {catalogFacetParams, readCatalogFilterDraft} from "./catalogFacetDraft";

describe("catalog draft facet requests", () => {
    it("restores repeated selections and price aliases without controls or removed aliases", () => {
        expect(readCatalogFilterDraft(new URLSearchParams("caseMaterial=1,2&caseMaterial=2&mechanism=3&page=7&sort=priceAsc&search=watch&brandCountry=4&minPrice=100&maxPrice=200")))
            .toEqual({filters: {caseMaterial: ["1", "2"], mechanism: ["3"]}, priceMin: "100", priceMax: "200"});
    });
    it("sends draft selections with the current search, independently of Apply and pagination", () => {
        const applied = readCatalogFilterDraft(new URLSearchParams("mechanism=1&page=8"));
        const draft = {...applied, filters: {...applied.filters, caseMaterial: ["3"]}};
        expect(catalogFacetParams(draft, " ceramic ").toString()).toBe("search=ceramic&caseMaterial=3&mechanism=1");
        expect(applied.filters).toEqual({mechanism: ["1"]});
    });
    it("normalizes a stable request key and clears choices on reset", () => {
        const a = catalogFacetParams({filters: {mechanism: ["2", "1", "2"], caseMaterial: ["3"]}, priceMin: "", priceMax: "null"}, null);
        const b = catalogFacetParams({filters: {caseMaterial: ["3"], mechanism: ["1,2"]}, priceMin: "", priceMax: ""}, null);
        expect(a.toString()).toBe(b.toString());
        expect(catalogFacetParams(readCatalogFilterDraft(new URLSearchParams()), null).toString()).toBe("");
    });
});
