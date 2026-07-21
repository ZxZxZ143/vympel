import type {MetadataRoute} from "next";

import {requireCanonicalSiteUrl} from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
    const siteUrl = requireCanonicalSiteUrl();
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: [
                "/api/",
                "/internal/",
                "/admin/",
                "/*/cart",
                "/*/favorites",
            ],
        },
        sitemap: new URL("/sitemap.xml", siteUrl).toString(),
        host: siteUrl.origin,
    };
}
