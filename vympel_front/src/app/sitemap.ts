import type {MetadataRoute} from "next";

import {buildSitemap, fetchSitemapCatalog} from "@/lib/sitemapCatalog";
import {requireCanonicalSiteUrl} from "@/lib/seo";
import {isSiteIndexingEnabled} from "@/lib/siteIndexing";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    if (!isSiteIndexingEnabled()) return [];

    const siteUrl = requireCanonicalSiteUrl();
    const catalog = await fetchSitemapCatalog();
    return buildSitemap(catalog, siteUrl);
}
