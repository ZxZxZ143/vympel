import {CATALOG_CONTROL_PARAM_SET, REMOVED_CATALOG_FILTER_PARAM_SET, normalizeCatalogQueryValue, normalizeCatalogQueryValues} from "./catalogFilterParams";

export type CatalogFilterFormValues = {
    filters: Record<string, string[]>;
    priceMin: string;
    priceMax: string;
};

export function readCatalogFilterDraft(params: URLSearchParams): CatalogFilterFormValues {
    const filters: Record<string, string[]> = {};
    for (const key of new Set(params.keys())) {
        if (CATALOG_CONTROL_PARAM_SET.has(key) || REMOVED_CATALOG_FILTER_PARAM_SET.has(key)) continue;
        const values = normalizeCatalogQueryValues(params.getAll(key));
        if (values.length) filters[key] = values;
    }
    return {
        filters,
        priceMin: normalizeCatalogQueryValue(params.get("priceMin") ?? params.get("minPrice")) ?? "",
        priceMax: normalizeCatalogQueryValue(params.get("priceMax") ?? params.get("maxPrice")) ?? "",
    };
}

export function catalogFacetParams(draft: CatalogFilterFormValues, search: string | null): URLSearchParams {
    const params = new URLSearchParams();
    const query = normalizeCatalogQueryValue(search);
    if (query) params.set("search", query);
    for (const key of Object.keys(draft.filters).sort()) {
        if (CATALOG_CONTROL_PARAM_SET.has(key) || REMOVED_CATALOG_FILTER_PARAM_SET.has(key)) continue;
        normalizeCatalogQueryValues(draft.filters[key]).sort().forEach(value => params.append(key, value));
    }
    for (const key of ["priceMin", "priceMax"] as const) {
        const value = normalizeCatalogQueryValue(draft[key]);
        if (value) params.set(key, value);
    }
    return params;
}
