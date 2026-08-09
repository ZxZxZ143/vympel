import type {MetadataRoute} from "next";

import {requireCanonicalSiteUrl} from "@/lib/seo";
import {isSiteIndexingEnabled} from "@/lib/siteIndexing";

export default function robots(): MetadataRoute.Robots {
    if (!isSiteIndexingEnabled()) {
        return {
            rules: {
                userAgent: "*",
                allow: "/",
            },
        };
    }

    const siteUrl = requireCanonicalSiteUrl();
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: [
                "/api/",
                "/internal/",
                "/admin/",
            ],
        },
        sitemap: new URL("/sitemap.xml", siteUrl).toString(),
        host: siteUrl.origin,
    };
}
