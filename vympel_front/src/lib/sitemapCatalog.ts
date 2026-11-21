import type {MetadataRoute} from "next";

import type {ICategory} from "@/api/types/CategoryTypes";
import type {IProduct} from "@/api/types/ProductTypes";
import {normalizePageResponse, type PageResponseLike} from "@/api/types/PageType";
import {PUBLIC_BRANDS} from "@/config/brandRoutes";
import {localizedAlternates, localizedPath, requireCanonicalSiteUrl, SEO_LOCALES} from "@/lib/seo";

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

type SitemapRoute = {
    segments: readonly string[];
    changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
    priority: number;
};

export function buildSitemap(
    catalog: SitemapCatalog,
    siteUrl = requireCanonicalSiteUrl(),
): MetadataRoute.Sitemap {
    const routes: SitemapRoute[] = [
        {segments: [], changeFrequency: "daily", priority: 1},
        {segments: ["catalog"], changeFrequency: "daily", priority: 0.9},
        {segments: ["brands"], changeFrequency: "weekly", priority: 0.7},
        {segments: ["about"], changeFrequency: "monthly", priority: 0.5},
        {segments: ["delivery"], changeFrequency: "monthly", priority: 0.4},
        {segments: ["guarantee"], changeFrequency: "monthly", priority: 0.4},
        {segments: ["payment"], changeFrequency: "monthly", priority: 0.4},
    ];
    for (const category of catalog.categories) {
        routes.push({segments: ["catalog", category.code], changeFrequency: "daily", priority: 0.8});
    }
    for (const brand of PUBLIC_BRANDS) {
        routes.push({segments: ["brands", brand.slug], changeFrequency: "weekly", priority: 0.7});
    }
    for (const product of catalog.products) {
        if ((product.status ?? "ACTIVE").toUpperCase() === "ACTIVE") {
            routes.push({segments: ["product", String(product.id)], changeFrequency: "weekly", priority: 0.6});
        }
    }

    const entries = new Map<string, MetadataRoute.Sitemap[number]>();
    for (const route of routes) {
        const languages = localizedAlternates(siteUrl, route.segments);
        for (const locale of SEO_LOCALES) {
            const url = new URL(localizedPath(locale, route.segments), siteUrl).toString();
            if (entries.has(url)) continue;
            entries.set(url, {
                url,
                changeFrequency: route.changeFrequency,
                priority: route.priority,
                alternates: {languages},
            });
        }
    }

    return [...entries.values()].sort((left, right) => left.url.localeCompare(right.url));
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
