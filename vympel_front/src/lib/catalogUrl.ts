import {
    REMOVED_CATALOG_FILTER_PARAM_SET,
    normalizeCatalogQueryValue,
    normalizeCatalogQueryValues,
} from "@/utils/catalogFilterParams";

export const DEFAULT_CATALOG_SORT = "priceAsc";
const CLEAN_PARAMS = new Set(["page", "sort", "size", "categoryCode"]);
const ALLOWED_SORTS = new Set(["priceAsc", "priceDesc", "newest", "oldest", "nameAsc", "nameDesc"]);

export type CatalogUrlPolicy = {
    categoryCode?: string;
    path: string;
    normalizedSearch: string;
    canonicalSearch: string;
    page: number;
    indexable: boolean;
    legacyCategory: boolean;
    hasFacets: boolean;
    redirectRequired: boolean;
};

export function classifyCatalogUrl(
    pathCategoryCode: string | null | undefined,
    input: URLSearchParams,
): CatalogUrlPolicy {
    const legacyCategory = normalizeCatalogQueryValue(input.get("categoryCode")) ?? undefined;
    const categoryCode = normalizeCatalogQueryValue(pathCategoryCode) ?? legacyCategory;
    const page = positivePage(input.get("page"));
    const normalized = new URLSearchParams();
    let hasFacets = false;

    const keys = Array.from(new Set(input.keys())).sort();
    for (const rawKey of keys) {
        if (rawKey === "categoryCode" || rawKey === "size") continue;
        const key = normalizeCatalogQueryValue(rawKey);
        if (!key || REMOVED_CATALOG_FILTER_PARAM_SET.has(key)) continue;

        if (key === "page") {
            if (page > 1) normalized.set("page", String(page));
            continue;
        }

        if (key === "sort") {
            const sort = normalizeCatalogQueryValue(input.get(key));
            if (sort && ALLOWED_SORTS.has(sort) && sort !== DEFAULT_CATALOG_SORT) {
                normalized.set("sort", sort);
                hasFacets = true;
            }
            continue;
        }

        const values = normalizeCatalogQueryValues(input.getAll(rawKey)).sort();
        values.forEach((value) => normalized.append(key, value));
        if (values.length > 0 || !CLEAN_PARAMS.has(key)) hasFacets = true;
    }

    const canonical = new URLSearchParams();
    if (page > 1) canonical.set("page", String(page));
    const path = categoryCode ? `/catalog/${encodeURIComponent(categoryCode)}` : "/catalog";
    const original = new URLSearchParams(input);
    original.delete("categoryCode");
    original.delete("size");

    return {
        categoryCode,
        path,
        normalizedSearch: normalized.toString(),
        canonicalSearch: canonical.toString(),
        page,
        indexable: !hasFacets,
        legacyCategory: Boolean(legacyCategory),
        hasFacets,
        redirectRequired: Boolean(legacyCategory) || original.toString() !== normalized.toString(),
    };
}

export function catalogHrefFromPolicy(policy: CatalogUrlPolicy): string {
    return policy.normalizedSearch ? `${policy.path}?${policy.normalizedSearch}` : policy.path;
}

function positivePage(value: string | null): number {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}
