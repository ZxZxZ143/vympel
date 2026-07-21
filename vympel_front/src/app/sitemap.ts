import type {MetadataRoute} from "next";

import {buildSitemap, fetchSitemapCatalog} from "@/lib/sitemapCatalog";
import {requireCanonicalSiteUrl} from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const siteUrl = requireCanonicalSiteUrl();
    const catalog = await fetchSitemapCatalog();
    return buildSitemap(catalog, siteUrl);
}
