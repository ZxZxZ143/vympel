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
