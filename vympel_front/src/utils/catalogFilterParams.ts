export const CATALOG_CONTROL_PARAM_SET = new Set([
    "page",
    "size",
    "sort",
    "categoryCode",
    "search",
    "priceMin",
    "priceMax",
    "minPrice",
    "maxPrice",
]);

export const REMOVED_CATALOG_FILTER_PARAM_SET = new Set([
    "brandCountry",
    "manufacturerCountry",
    "countryOfBrand",
]);

const EMPTY_QUERY_VALUES = new Set(["null", "undefined", "[]"]);

export function normalizeCatalogQueryValue(value: string | null | undefined): string | null {
    const trimmed = value?.trim();

    if (!trimmed) {
        return null;
    }

    return EMPTY_QUERY_VALUES.has(trimmed.toLowerCase()) ? null : trimmed;
}

export function normalizeCatalogQueryValues(values: Array<string | null | undefined> | null | undefined): string[] {
    if (!values?.length) {
        return [];
    }

    return Array.from(
        new Set(
            values
                .filter((value): value is string => value !== null && value !== undefined)
                .flatMap((value) => value.split(","))
                .map(normalizeCatalogQueryValue)
                .filter((value): value is string => Boolean(value))
        )
    );
}
