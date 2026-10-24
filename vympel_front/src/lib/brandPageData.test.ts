import {afterEach, describe, expect, it, vi} from "vitest";
import {PublicApiController} from "@/api/controllers/PublicController";
import {LocaleEnum} from "@/i18n/routing";
import {normalizePageResponse} from "@/api/types/PageType";
import type {ICatalogFiltersResponse, IProduct} from "@/api/types/ProductTypes";
import {loadBrandProducts} from "./brandPageData";
import {PUBLIC_BRANDS} from "@/config/brandRoutes";

afterEach(() => vi.restoreAllMocks());
function fixtures(count: number) {
    vi.spyOn(PublicApiController, "getCatalogFilters").mockResolvedValue({filters: [{key: "brand", options:
        PUBLIC_BRANDS.map((brand, index) => ({label: brand.displayName, value: String(index + 1)}))}]} as ICatalogFiltersResponse);
    return vi.spyOn(PublicApiController, "getCatalogProducts").mockImplementation(async (request) => {
        const offset = (request.page ?? 0) * request.size!;
        return normalizePageResponse({content: Array.from({length: Math.max(0, Math.min(15, count - offset))}, (_, i) => ({id: offset + i + 1}) as IProduct),
            number: request.page, size: request.size, totalElements: count, totalPages: Math.ceil(count / 15)});
    });
}
describe("brand server pagination", () => {
    it.each([0, 1, 15, 16, 30, 31, 57])("reaches all %i models without overlaps", async (count) => {
        const fetch = fixtures(count);
        const ids: number[] = [];
        for (let page = 1; page <= Math.max(1, Math.ceil(count / 15)); page++) {
            const data = await loadBrandProducts(LocaleEnum.RU, "romanson", page);
            expect(data.result.status).toBe("success");
            if (data.result.status !== "success") throw new Error("load failed");
            expect(data.result.page.totalPages).toBe(Math.ceil(count / 15));
            ids.push(...data.result.page.content.map((item) => item.id));
            expect(fetch).toHaveBeenLastCalledWith(expect.objectContaining({page: page - 1, size: 15, sort: "newest", filters: {brand: [data.brandFilterValue]}}));
        }
        expect(ids).toEqual(Array.from({length: count}, (_, i) => i + 1));
        expect((await loadBrandProducts(LocaleEnum.RU, "romanson", Math.max(2, Math.ceil(count / 15) + 1))).result.status).toBe("out_of_range");
    });
    it("uses the same paginated query for all configured brands and locales", async () => {
        const fetch = fixtures(57);
        for (const brand of PUBLIC_BRANDS) for (const locale of Object.values(LocaleEnum)) {
            const data = await loadBrandProducts(locale, brand.slug, 2);
            expect(data.result.status).toBe("success");
            expect(fetch).toHaveBeenLastCalledWith(expect.objectContaining({lang: locale, page: 1, size: 15, filters: {brand: [data.brandFilterValue]}}));
        }
    });
    it("preserves transient failures instead of inventing an empty or missing page", async () => {
        fixtures(16).mockRejectedValue(new Error("temporary"));
        expect((await loadBrandProducts(LocaleEnum.EN, "romanson", 2)).result.status).toBe("transient_error");
    });
});
