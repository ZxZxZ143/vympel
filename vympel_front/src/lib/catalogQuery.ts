import type {IProductListParams} from "@/api/types/ProductTypes";
import {ProductSortEnum} from "@/enums/SortEnum";
import {LocaleEnum} from "@/i18n/routing";
import {DEFAULT_CATALOG_SORT} from "@/lib/catalogUrl";
import {
    CATALOG_CONTROL_PARAM_SET,
    REMOVED_CATALOG_FILTER_PARAM_SET,
    normalizeCatalogQueryValue,
    normalizeCatalogQueryValues,
} from "@/utils/catalogFilterParams";
import {isAccessoryCategoryCode} from "@/utils/catalogCategories";
import {SEEDED_FILTER_VALUES} from "@/config/routes";

export type NextSearchParams = Record<string, string | string[] | undefined>;

export function toUrlSearchParams(input: NextSearchParams): URLSearchParams {
    const params = new URLSearchParams();
    Object.entries(input).forEach(([key, value]) => {
        (Array.isArray(value) ? value : [value]).forEach((item) => {
            if (item != null) params.append(key, item);
        });
    });
    return params;
}

export function catalogRequestParams(
    locale: LocaleEnum,
    categoryCode: string | undefined,
    searchParams: URLSearchParams,
): IProductListParams {
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const sort = normalizeCatalogQueryValue(searchParams.get("sort")) ?? DEFAULT_CATALOG_SORT;
    const accessories = isAccessoryCategoryCode(categoryCode);
    return {
        page: page - 1,
        size: 9,
        categoryCode,
        lang: locale,
        sort: sort as ProductSortEnum,
        search: normalizeCatalogQueryValue(searchParams.get("search")) ?? undefined,
        priceMin: accessories ? undefined : normalizeCatalogQueryValue(searchParams.get("priceMin")) ?? undefined,
        priceMax: accessories ? undefined : normalizeCatalogQueryValue(searchParams.get("priceMax")) ?? undefined,
        filters: accessories ? accessoryFilters(searchParams) : catalogFilters(searchParams),
    };
}

function catalogFilters(searchParams: URLSearchParams): Record<string, string[]> {
    const filters: Record<string, string[]> = {};
    searchParams.forEach((value, rawKey) => {
        if (CATALOG_CONTROL_PARAM_SET.has(rawKey)) return;
        const key = normalizeCatalogQueryValue(rawKey);
        if (!key || REMOVED_CATALOG_FILTER_PARAM_SET.has(key)) return;
        const values = normalizeCatalogQueryValues([value]);
        if (values.length === 0) return;
        filters[key] = Array.from(new Set([...(filters[key] ?? []), ...values]));
    });
    return filters;
}

function accessoryFilters(searchParams: URLSearchParams): Record<string, string[]> {
    const allowed = new Set<string>([SEEDED_FILTER_VALUES.gender.women, SEEDED_FILTER_VALUES.gender.men]);
    const gender = normalizeCatalogQueryValues(searchParams.getAll("gender")).find((value) => allowed.has(value));
    return gender ? {gender: [gender]} : {};
}

function parsePositiveInt(value: string | null, fallback: number): number {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
