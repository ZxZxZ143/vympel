import {ProductSortEnum} from "@/enums/SortEnum";
import {normalizeCatalogQueryValue} from "@/utils/catalogFilterParams";

export const DEFAULT_CATALOG_SORT = ProductSortEnum.PRICE_ASC;
const allowedSorts = new Set<string>(Object.values(ProductSortEnum));

export function explicitCatalogSort(params: URLSearchParams): ProductSortEnum | undefined {
    const value = normalizeCatalogQueryValue(params.get("sort"));
    return value && allowedSorts.has(value) ? value as ProductSortEnum : undefined;
}

/** Absent sort during search means server relevance, not the browsing default. */
export function effectiveCatalogSort(params: URLSearchParams): ProductSortEnum | undefined {
    return explicitCatalogSort(params)
        ?? (normalizeCatalogQueryValue(params.get("search")) ? undefined : DEFAULT_CATALOG_SORT);
}

export function catalogSortSearch(params: URLSearchParams, sort?: string): URLSearchParams {
    const next = new URLSearchParams(params);
    if (sort) next.set("sort", sort);
    else next.delete("sort");
    next.delete("page");
    return next;
}
