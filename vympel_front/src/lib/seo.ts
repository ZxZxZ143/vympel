import type {Metadata} from "next";

import {LocaleEnum} from "@/i18n/routing";

export const SEO_LOCALES = [LocaleEnum.RU, LocaleEnum.KZ, LocaleEnum.EN] as const;

const HREF_LANG: Record<LocaleEnum, string> = {
    [LocaleEnum.RU]: "ru",
    [LocaleEnum.KZ]: "kk",
    [LocaleEnum.EN]: "en",
};

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
): Record<string, string> {
    const languages = Object.fromEntries(SEO_LOCALES.map((locale) => [
        HREF_LANG[locale],
        new URL(localizedPath(locale, routeSegments), siteUrl).toString(),
    ]));
    return {
        ...languages,
        "x-default": new URL(localizedPath(LocaleEnum.RU, routeSegments), siteUrl).toString(),
    };
}

export function publicSeoMetadata(
    locale: LocaleEnum,
    routeSegments: readonly string[] = [],
    title = "Vympel",
): Metadata {
    const siteUrl = requireCanonicalSiteUrl();
    return {
        title,
        alternates: {
            canonical: new URL(localizedPath(locale, routeSegments), siteUrl).toString(),
            languages: localizedAlternates(siteUrl, routeSegments),
        },
        robots: {
            index: true,
            follow: true,
        },
    };
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
