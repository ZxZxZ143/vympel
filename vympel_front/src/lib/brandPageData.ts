import {cache} from "react";
import {PublicApiController} from "@/api/controllers/PublicController";
import {getBrandPageData} from "@/config/brandPages";
import {normalizeBrandLookup} from "@/config/brandRoutes";
import {LocaleEnum} from "@/i18n/routing";
import {ProductSortEnum} from "@/enums/SortEnum";
import {loadCatalogPageData, type CatalogPageData} from "@/lib/catalogPageData";

export const BRAND_PAGE_SIZE = 15;
export type BrandProductsData = {brandFilterValue?: string; result: CatalogPageData};

export const loadBrandProducts = cache(async (locale: LocaleEnum, slug: string, page: number): Promise<BrandProductsData> => {
    try {
        const brand = getBrandPageData(slug, locale);
        if (!brand) return {result: {status: "out_of_range"}};
        const filters = await PublicApiController.getCatalogFilters(locale);
        const names = new Set(brand.matchingNames.map(normalizeBrandLookup));
        const brandFilterValue = filters?.filters.find((filter) => filter.key === "brand")?.options
            .find((option) => names.has(normalizeBrandLookup(option.label)))?.value;
        if (!brandFilterValue) throw new Error("Brand filter is unavailable");
        const result = await loadCatalogPageData({lang: locale, page: page - 1, size: BRAND_PAGE_SIZE,
            sort: ProductSortEnum.NEWEST, filters: {brand: [brandFilterValue]}});
        return {brandFilterValue, result};
    } catch (error) {
        return {result: {status: "transient_error", error}};
    }
});
