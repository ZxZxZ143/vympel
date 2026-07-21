import type {MetadataRoute} from "next";

import type {ICategory} from "@/api/types/CategoryTypes";
import type {IProduct} from "@/api/types/ProductTypes";
import {normalizePageResponse, type PageResponseLike} from "@/api/types/PageType";
import {PUBLIC_BRANDS} from "@/config/brandRoutes";
import {localizedPath, requireCanonicalSiteUrl, SEO_LOCALES} from "@/lib/seo";

const MAX_PRODUCT_PAGES = 1_000;
const PRODUCT_PAGE_SIZE = 60;

export type SitemapCatalog = {
    categories: ICategory[];
    products: IProduct[];
};

type FetchLike = typeof fetch;

export async function fetchSitemapCatalog(
    rawBaseApiUrl = process.env.BASE_API_PUBLIC ?? process.env.NEXT_PUBLIC_BASE_API_PUBLIC,
    fetcher: FetchLike = fetch,
): Promise<SitemapCatalog> {
    if (!rawBaseApiUrl?.trim()) {
        throw new Error("Public API base URL is required to generate a complete sitemap");
    }

    let baseApiUrl: URL;
    try {
        baseApiUrl = new URL(ensureTrailingSlash(rawBaseApiUrl.trim()));
    } catch {
        throw new Error("Public API base URL is invalid");
    }

    const categoriesResponse = await fetchWithTimeout(
        new URL("category/all/ru", baseApiUrl),
        fetcher,
    );
    const categoryPayload: unknown = await categoriesResponse.json();
    if (!Array.isArray(categoryPayload)) {
        throw new Error("Public category API returned an invalid sitemap payload");
    }
    const categories = categoryPayload.filter(isCategory);
    if (categories.length !== categoryPayload.length) {
        throw new Error("Public category API returned an invalid category route");
    }

    const products: IProduct[] = [];
    let pageNumber = 0;
    let totalPages = 1;
    while (pageNumber < totalPages) {
        if (pageNumber >= MAX_PRODUCT_PAGES) {
            throw new Error("Public product API exceeded the bounded sitemap page limit");
        }
        const productsUrl = new URL("product/catalog/ru", baseApiUrl);
        productsUrl.searchParams.set("page", String(pageNumber));
        productsUrl.searchParams.set("size", String(PRODUCT_PAGE_SIZE));
        productsUrl.searchParams.set("sort", "newest");
        const response = await fetchWithTimeout(productsUrl, fetcher);
        const payload = await response.json() as PageResponseLike<IProduct>;
        const page = normalizePageResponse<IProduct>(payload, {page: pageNumber, size: PRODUCT_PAGE_SIZE});
        if (page.content.some((product) => !isProduct(product))) {
            throw new Error("Public product API returned an invalid product route");
        }
        products.push(...page.content);
        totalPages = page.totalPages;
        pageNumber += 1;
    }

    return {categories, products};
}

export function buildSitemap(
    catalog: SitemapCatalog,
    siteUrl = requireCanonicalSiteUrl(),
): MetadataRoute.Sitemap {
    const staticRoutes: readonly string[][] = [
        [],
        ["about"],
        ["brands"],
        ["catalog"],
        ["delivery"],
        ["guarantee"],
        ["payment"],
    ];
    const paths = new Set<string>();

    for (const locale of SEO_LOCALES) {
        for (const route of staticRoutes) {
            paths.add(localizedPath(locale, route));
        }
        for (const category of catalog.categories) {
            paths.add(localizedPath(locale, ["catalog", category.code]));
        }
        for (const brand of PUBLIC_BRANDS) {
            paths.add(localizedPath(locale, ["brands", brand.slug]));
        }
        for (const product of catalog.products) {
            if ((product.status ?? "ACTIVE").toUpperCase() === "ACTIVE") {
                paths.add(localizedPath(locale, ["product", String(product.id)]));
            }
        }
    }

    return [...paths]
        .sort()
        .map((path) => ({url: new URL(path, siteUrl).toString()}));
}

async function fetchWithTimeout(url: URL, fetcher: FetchLike): Promise<Response> {
    let response: Response;
    try {
        response = await fetcher(url, {
            cache: "no-store",
            signal: AbortSignal.timeout(5_000),
        });
    } catch {
        throw new Error(`Public API is unavailable while generating sitemap data (${url.pathname})`);
    }
    if (!response.ok) {
        throw new Error(`Public API rejected sitemap data (${url.pathname}, HTTP ${response.status})`);
    }
    return response;
}

function ensureTrailingSlash(value: string): string {
    return value.endsWith("/") ? value : `${value}/`;
}

function isCategory(value: unknown): value is ICategory {
    if (typeof value !== "object" || value === null) return false;
    const candidate = value as Partial<ICategory>;
    return Number.isInteger(candidate.id)
        && typeof candidate.code === "string"
        && candidate.code.trim().length > 0
        && typeof candidate.name === "string";
}

function isProduct(value: unknown): value is IProduct {
    if (typeof value !== "object" || value === null) return false;
    const candidate = value as Partial<IProduct>;
    return Number.isInteger(candidate.id) && Number(candidate.id) > 0;
}
