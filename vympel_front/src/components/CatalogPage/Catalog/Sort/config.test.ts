import {describe, expect, it} from "vitest";
import {sortOptions} from "@/components/CatalogPage/Catalog/Sort/config";

describe("catalog sort contract", () => {
    it("emits only backend-supported values", () => {
        expect(sortOptions.map((option) => option.value)).toEqual([
            "priceAsc",
            "priceDesc",
            "newest",
            "oldest",
        ]);
    });
});
