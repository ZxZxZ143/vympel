import {describe, expect, it} from "vitest";

import {
    findPublicBrandBySlug,
    PUBLIC_BRANDS,
} from "@/config/brandRoutes";

describe("supported public brand contract", () => {
    it("contains only the six canonical brands", () => {
        expect(PUBLIC_BRANDS.map((brand) => [brand.slug, brand.databaseCode])).toEqual([
            ["romanson", "romanson"],
            ["adriatica", "adriatica"],
            ["appella", "appella"],
            ["pierre-ricaud", "pierre-ricaud"],
            ["rhythm", "rhythm"],
            ["royal-london", "royal-london"],
        ]);
        expect(findPublicBrandBySlug("pierre-ricaud")?.matchingNames).toEqual(["Pierre Ricaud", "pierre-ricaud"]);
    });
});
