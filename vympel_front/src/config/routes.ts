import {LocaleEnum} from "@/i18n/routing";
import type {BrandSlug} from "@/config/brandRoutes";
import {normalizeCatalogQueryValue, normalizeCatalogQueryValues} from "@/utils/catalogFilterParams";
import {catalogHrefFromPolicy, classifyCatalogUrl} from "@/lib/catalogUrl";
import {instagramProfileUrl} from "@/config/socialLinks";

type CatalogFilterValue = string | number | Array<string | number> | null | undefined;
type CatalogFilters = Record<string, CatalogFilterValue>;
type SearchParamsLike = {
    forEach(callback: (value: string, key: string) => void): void;
};

export const PUBLIC_CATEGORY_CODES = {
    wrist: "WATCH_WRIST",
    interior: "WATCH_INTERIOR",
    accessories: "ACCESSORIES",
    kids: "WATCH_KIDS",
    classic: "WATCH_CLASSIC",
    sport: "WATCH_SPORT",
    diver: "WATCH_DIVER",
    chronograph: "WATCH_CHRONOGRAPH",
} as const;

export const SEEDED_FILTER_VALUES = {
    gender: {
        men: "1",
        women: "2",
        unisex: "3",
    },
} as const;

export const CATEGORY_CHANGE_PRESERVED_PARAMS = new Set(["search", "sort"]);

export const CONTACT_LINKS = {
    phoneNumber: "+77474080620",
    phone: "tel:+77474080620",
    whatsapp: "https://wa.me/77474080620",
    instagram: instagramProfileUrl,
} as const;

export const MARKETPLACE_LINKS = {
    kaspi: "https://kaspi.kz/shop/m/1433003/products?productCode=110688026&masterSku=110688026&merchantSku=AM%2b003%2bH%2bBRONZE&tabId=PRODUCT&started_by=shop_product&ref=shared_link&sessionId=b58a609e-9e07-4c3b-b683-fcf5ccec61d51785317673&link_source=chrome",
    wildberries: "https://global.wildberries.ru/seller/4398117",
} as const;

export type MarketplaceKey = keyof typeof MARKETPLACE_LINKS;

function isHostWithinDomain(hostname: string, domain: string) {
    return hostname === domain || hostname.endsWith(`.${domain}`);
}

export function resolveMarketplaceHref(url: URL): string | null | undefined {
    const hostname = url.hostname.toLowerCase();

    if (isHostWithinDomain(hostname, "kaspi.kz")) {
        return MARKETPLACE_LINKS.kaspi;
    }

    if (isHostWithinDomain(hostname, "wildberries.ru")) {
        return MARKETPLACE_LINKS.wildberries;
    }

    if (isHostWithinDomain(hostname, "ozon.ru") || isHostWithinDomain(hostname, "ozon.kz")) {
        return null;
    }

    return undefined;
}

export type CatalogRouteParams = {
    categoryCode?: string | null;
    search?: string | null;
    page?: string | number | null;
    sort?: string | null;
    priceMin?: string | number | null;
    priceMax?: string | number | null;
    filters?: CatalogFilters;
};

function appendParam(params: URLSearchParams, key: string, value: string | number | null | undefined) {
    const normalizedKey = normalizeCatalogQueryValue(key);
    const normalizedValue = normalizeCatalogQueryValue(value == null ? null : String(value));

    if (!normalizedKey || !normalizedValue) {
        return;
    }

    params.append(normalizedKey, normalizedValue);
}

function appendFilter(params: URLSearchParams, key: string, value: CatalogFilterValue) {
    const values = Array.isArray(value) ? value : [value];
    normalizeCatalogQueryValues(values.map((item) => item == null ? null : String(item)))
        .forEach((normalizedValue) => appendParam(params, key, normalizedValue));
}

export function isExternalHref(href: string) {
    return /^(https?:|mailto:|tel:)/i.test(href);
}

export function withLocale(locale: LocaleEnum, href: string) {
    if (isExternalHref(href) || href.startsWith("#")) {
        return href;
    }

    if (href === "/") {
        return `/${locale}`;
    }

    return `/${locale}${href.startsWith("/") ? href : `/${href}`}`;
}

export function home() {
    return "/";
}

export function catalog(params: CatalogRouteParams = {}) {
    const searchParams = new URLSearchParams();

    appendParam(searchParams, "search", params.search);
    appendParam(searchParams, "priceMin", params.priceMin);
    appendParam(searchParams, "priceMax", params.priceMax);
    appendParam(searchParams, "sort", params.sort);
    appendParam(searchParams, "page", params.page);

    Object.entries(params.filters ?? {}).forEach(([key, value]) => {
        appendFilter(searchParams, key, value);
    });

    return catalogHrefFromPolicy(classifyCatalogUrl(params.categoryCode, searchParams));
}

export function catalogFromSearchParams(params: URLSearchParams, categoryCode?: string | null) {
    return catalogHrefFromPolicy(classifyCatalogUrl(categoryCode, params));
}

export function category(categoryCode: string | null | undefined) {
    return catalog({categoryCode});
}

export function filteredCatalog(params: CatalogRouteParams) {
    return catalog({...params, page: params.page ?? 1});
}

export function searchCatalog(search: string | null | undefined) {
    return catalog({search, page: 1});
}

export function categorySelectionCatalog(categoryCode: string | null | undefined, currentParams?: SearchParamsLike | null) {
    const params = new URLSearchParams();

    currentParams?.forEach((value, key) => {
        if (CATEGORY_CHANGE_PRESERVED_PARAMS.has(key)) {
            appendParam(params, key, value);
        }
    });

    return catalogFromSearchParams(params, categoryCode);
}

export function product(productId: string | number) {
    return `/product/${encodeURIComponent(String(productId))}`;
}

export function brand(brandSlug: BrandSlug | string) {
    return `/brands/${brandSlug}`;
}

export function brands() {
    return "/brands";
}

export function favorites() {
    return "/favorites";
}

export function cart() {
    return "/cart";
}

export function payment() {
    return "/payment";
}

export function delivery() {
    return "/delivery";
}

export function guarantee() {
    return "/guarantee";
}

export function about() {
    return "/about";
}

export const catalogLinks = {
    wristWatches: category(PUBLIC_CATEGORY_CODES.wrist),
    interiorWatches: category(PUBLIC_CATEGORY_CODES.interior),
    accessories: category(PUBLIC_CATEGORY_CODES.accessories),
    menWatches: filteredCatalog({
        categoryCode: PUBLIC_CATEGORY_CODES.wrist,
        filters: {gender: SEEDED_FILTER_VALUES.gender.men},
    }),
    womenWatches: filteredCatalog({
        categoryCode: PUBLIC_CATEGORY_CODES.wrist,
        filters: {gender: SEEDED_FILTER_VALUES.gender.women},
    }),
    sportWatches: category(PUBLIC_CATEGORY_CODES.sport),
    kidsWatches: category(PUBLIC_CATEGORY_CODES.kids),
};

export const routes = {
    home,
    catalog,
    catalogFromSearchParams,
    category,
    filteredCatalog,
    searchCatalog,
    categorySelectionCatalog,
    product,
    brand,
    brands,
    favorites,
    cart,
    payment,
    delivery,
    guarantee,
    about,
    withLocale,
    isExternalHref,
};
