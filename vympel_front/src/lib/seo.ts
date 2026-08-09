import type {Metadata} from "next";

import {LocaleEnum} from "@/i18n/routing";
import {isSiteIndexingEnabled} from "@/lib/siteIndexing";
import type {SeoContent} from "@/lib/seoContent";

export const SEO_LOCALES = [LocaleEnum.RU, LocaleEnum.KZ, LocaleEnum.EN] as const;

const HREF_LANG: Record<LocaleEnum, string> = {
    [LocaleEnum.RU]: "ru",
    [LocaleEnum.KZ]: "kk",
    [LocaleEnum.EN]: "en",
};

const OPEN_GRAPH_LOCALE: Record<LocaleEnum, string> = {
    [LocaleEnum.RU]: "ru_RU",
    [LocaleEnum.KZ]: "kk_KZ",
    [LocaleEnum.EN]: "en_US",
};

const FALLBACK_SHARE_IMAGE = {
    path: "/about-us-banner.webp",
    width: 2560,
    height: 884,
    type: "image/webp",
} as const;

export function requireCanonicalSiteUrl(rawValue = process.env.NEXT_PUBLIC_SITE_URL): URL {
    if (!rawValue?.trim()) {
        throw new Error("NEXT_PUBLIC_SITE_URL is required for canonical metadata and sitemap generation");
    }

    let url: URL;
    try {
        url = new URL(rawValue.trim());
    } catch {
        throw new Error("NEXT_PUBLIC_SITE_URL must be an absolute HTTP(S) URL");
    }

    if (!(["http:", "https:"] as string[]).includes(url.protocol)) {
        throw new Error("NEXT_PUBLIC_SITE_URL must use HTTP or HTTPS");
    }
    if (url.username || url.password || url.search || url.hash || (url.pathname !== "/" && url.pathname !== "")) {
        throw new Error("NEXT_PUBLIC_SITE_URL must be an origin without credentials, path, query, or fragment");
    }

    url.pathname = "/";
    return url;
}

export function localizedPath(locale: LocaleEnum, routeSegments: readonly string[] = []): string {
    const encoded = routeSegments
        .filter((segment) => segment.trim().length > 0)
        .map((segment) => encodeURIComponent(segment.trim()));
    return `/${locale}${encoded.length > 0 ? `/${encoded.join("/")}` : ""}`;
}

export function localizedAlternates(
    siteUrl: URL,
    routeSegments: readonly string[] = [],
    search = "",
): Record<string, string> {
    const languages = Object.fromEntries(SEO_LOCALES.map((locale) => [
        HREF_LANG[locale],
        absoluteLocalizedUrl(siteUrl, locale, routeSegments, search),
    ]));
    return {
        ...languages,
        "x-default": absoluteLocalizedUrl(siteUrl, LocaleEnum.RU, routeSegments, search),
    };
}

function absoluteLocalizedUrl(siteUrl: URL, locale: LocaleEnum, routeSegments: readonly string[], search = ""): string {
    const url = new URL(localizedPath(locale, routeSegments), siteUrl);
    url.search = search;
    return url.toString();
}

export type PublicSeoOptions = {
    indexable?: boolean;
    canonicalSearch?: string;
    imageUrl?: string | null;
    imageAlt?: string;
};

export function publicSeoMetadata(
    locale: LocaleEnum,
    routeSegments: readonly string[] = [],
    content: SeoContent,
    options: PublicSeoOptions = {},
): Metadata {
    const indexingEnabled = isSiteIndexingEnabled();
    if (!indexingEnabled) {
        return {
            title: content.title,
            description: content.description,
            robots: {
                index: false,
                follow: false,
                googleBot: {index: false, follow: false},
            },
        };
    }

    const siteUrl = requireCanonicalSiteUrl();
    const indexable = indexingEnabled && options.indexable !== false;
    const canonicalSearch = options.canonicalSearch ?? "";
    const canonicalUrl = absoluteLocalizedUrl(siteUrl, locale, routeSegments, canonicalSearch);
    const shareImage = safeShareImageUrl(siteUrl, options.imageUrl) ?? new URL(FALLBACK_SHARE_IMAGE.path, siteUrl).toString();
    const shareImageMetadata = {
        url: shareImage,
        width: shareImage.endsWith(FALLBACK_SHARE_IMAGE.path) ? FALLBACK_SHARE_IMAGE.width : undefined,
        height: shareImage.endsWith(FALLBACK_SHARE_IMAGE.path) ? FALLBACK_SHARE_IMAGE.height : undefined,
        type: shareImage.endsWith(FALLBACK_SHARE_IMAGE.path) ? FALLBACK_SHARE_IMAGE.type : undefined,
        alt: options.imageAlt ?? content.title,
    };
    return {
        title: content.title,
        description: content.description,
        alternates: indexingEnabled
            ? {
                canonical: canonicalUrl,
                languages: localizedAlternates(siteUrl, routeSegments, canonicalSearch),
            }
            : undefined,
        robots: {
            index: indexable,
            follow: indexingEnabled,
            googleBot: {
                index: indexable,
                follow: indexingEnabled,
            },
        },
        openGraph: indexable ? {
            type: "website",
            siteName: "Vympel",
            title: content.title,
            description: content.description,
            url: canonicalUrl,
            locale: OPEN_GRAPH_LOCALE[locale],
            alternateLocale: SEO_LOCALES.filter((item) => item !== locale).map((item) => OPEN_GRAPH_LOCALE[item]),
            images: [shareImageMetadata],
        } : undefined,
        twitter: indexable ? {
            card: "summary_large_image",
            title: content.title,
            description: content.description,
            images: [shareImageMetadata],
        } : undefined,
    };
}

export function safeShareImageUrl(siteUrl: URL, candidate?: string | null): string | null {
    if (!candidate?.trim()) return null;
    try {
        const url = new URL(candidate.trim(), siteUrl);
        if (url.protocol !== "https:" && url.origin !== siteUrl.origin) return null;
        const allowedOrigins = new Set([
            siteUrl.origin,
            ...(process.env.NEXT_PUBLIC_MEDIA_ORIGINS ?? "")
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean)
                .flatMap((value) => {
                    try { return [new URL(value).origin]; } catch { return []; }
                }),
        ]);
        return allowedOrigins.has(url.origin) ? url.toString() : null;
    } catch {
        return null;
    }
}

export function privatePageMetadata(title = "Vympel"): Metadata {
    return {
        title,
        robots: {
            index: false,
            follow: false,
            googleBot: {
                index: false,
                follow: false,
            },
        },
    };
}
