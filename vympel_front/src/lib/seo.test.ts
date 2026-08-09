import {afterEach, describe, expect, it} from "vitest";

import {LocaleEnum} from "@/i18n/routing";
import sitemap from "@/app/sitemap";
import {localizedAlternates, privatePageMetadata, publicSeoMetadata, requireCanonicalSiteUrl, safeShareImageUrl} from "./seo";
import {staticSeoContent} from "./seoContent";
import robots from "@/app/robots";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const originalIndexing = process.env.SITE_INDEXING_ENABLED;
const originalMediaOrigins = process.env.NEXT_PUBLIC_MEDIA_ORIGINS;

afterEach(() => {
    if (originalSiteUrl == null) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    if (originalIndexing == null) delete process.env.SITE_INDEXING_ENABLED;
    else process.env.SITE_INDEXING_ENABLED = originalIndexing;
    if (originalMediaOrigins == null) delete process.env.NEXT_PUBLIC_MEDIA_ORIGINS;
    else process.env.NEXT_PUBLIC_MEDIA_ORIGINS = originalMediaOrigins;
});

describe("SEO canonical metadata", () => {
    it("builds the route canonical and RU/KK/EN alternates", () => {
        process.env.NEXT_PUBLIC_SITE_URL = "https://shop.example.test";
        process.env.SITE_INDEXING_ENABLED = "true";
        const metadata = publicSeoMetadata(LocaleEnum.KZ, ["product", "42"], staticSeoContent(LocaleEnum.KZ, "catalog"));

        expect(metadata.alternates?.canonical).toBe("https://shop.example.test/kz/product/42");
        expect(metadata.alternates?.languages).toEqual({
            ru: "https://shop.example.test/ru/product/42",
            kk: "https://shop.example.test/kz/product/42",
            en: "https://shop.example.test/en/product/42",
            "x-default": "https://shop.example.test/ru/product/42",
        });
        expect(metadata.openGraph).toMatchObject({
            title: staticSeoContent(LocaleEnum.KZ, "catalog").title,
            description: staticSeoContent(LocaleEnum.KZ, "catalog").description,
            url: "https://shop.example.test/kz/product/42",
            locale: "kk_KZ",
            siteName: "Vympel",
        });
        expect(metadata.twitter).toMatchObject({card: "summary_large_image"});
    });

    it("rejects missing and path-bearing site URL configuration", () => {
        delete process.env.NEXT_PUBLIC_SITE_URL;
        expect(() => requireCanonicalSiteUrl()).toThrow(/required/);
        expect(() => requireCanonicalSiteUrl("https://shop.example.test/store")).toThrow(/origin/);
    });

    it("maps the kz route to the kk hreflang", () => {
        expect(localizedAlternates(new URL("https://shop.example.test"), ["catalog"]).kk)
            .toBe("https://shop.example.test/kz/catalog");
    });

    it("publishes the sitemap while excluding private and internal routes", () => {
        process.env.NEXT_PUBLIC_SITE_URL = "https://shop.example.test";
        process.env.SITE_INDEXING_ENABLED = "true";
        const policy = robots();
        expect(policy.sitemap).toBe("https://shop.example.test/sitemap.xml");
        expect(policy.rules).toMatchObject({
            allow: "/",
            disallow: expect.arrayContaining(["/api/", "/admin/"]),
        });
        expect(policy.rules).not.toMatchObject({
            disallow: expect.arrayContaining(["/*/cart", "/*/favorites"]),
        });
    });

    it("fails closed without release approval and publishes no discovery inventory", async () => {
        delete process.env.NEXT_PUBLIC_SITE_URL;
        delete process.env.SITE_INDEXING_ENABLED;

        const metadata = publicSeoMetadata(LocaleEnum.EN, ["catalog"], staticSeoContent(LocaleEnum.EN, "catalog"));
        expect(metadata.robots).toMatchObject({index: false, follow: false});
        expect(metadata.alternates).toBeUndefined();
        expect(metadata.openGraph).toBeUndefined();
        expect(metadata.twitter).toBeUndefined();
        expect(robots()).toEqual({rules: {userAgent: "*", allow: "/"}});
        expect(await sitemap()).toEqual([]);
    });

    it("accepts only same-origin or configured HTTPS share images", () => {
        const siteUrl = new URL("https://shop.example.test");
        process.env.NEXT_PUBLIC_MEDIA_ORIGINS = "https://media.example.test";
        expect(safeShareImageUrl(siteUrl, "/about-us-banner.webp")).toBe("https://shop.example.test/about-us-banner.webp");
        expect(safeShareImageUrl(siteUrl, "https://media.example.test/product.webp")).toBe("https://media.example.test/product.webp");
        expect(safeShareImageUrl(siteUrl, "https://evil.example/product.webp")).toBeNull();
        expect(safeShareImageUrl(siteUrl, "javascript:alert(1)")).toBeNull();
    });

    it("keeps cart and favorites private without hiding their noindex directive", () => {
        expect(privatePageMetadata("Cart").robots).toMatchObject({
            index: false,
            follow: false,
        });
    });
});
