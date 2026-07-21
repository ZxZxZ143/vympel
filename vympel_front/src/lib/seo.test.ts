import {afterEach, describe, expect, it} from "vitest";

import {LocaleEnum} from "@/i18n/routing";
import {localizedAlternates, publicSeoMetadata, requireCanonicalSiteUrl} from "./seo";
import robots from "@/app/robots";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
    if (originalSiteUrl == null) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
});

describe("SEO canonical metadata", () => {
    it("builds the route canonical and RU/KK/EN alternates", () => {
        process.env.NEXT_PUBLIC_SITE_URL = "https://shop.example.test";
        const metadata = publicSeoMetadata(LocaleEnum.KZ, ["product", "42"], "Product");

        expect(metadata.alternates?.canonical).toBe("https://shop.example.test/kz/product/42");
        expect(metadata.alternates?.languages).toEqual({
            ru: "https://shop.example.test/ru/product/42",
            kk: "https://shop.example.test/kz/product/42",
            en: "https://shop.example.test/en/product/42",
            "x-default": "https://shop.example.test/ru/product/42",
        });
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
        const policy = robots();
        expect(policy.sitemap).toBe("https://shop.example.test/sitemap.xml");
        expect(policy.rules).toMatchObject({
            allow: "/",
            disallow: expect.arrayContaining(["/api/", "/admin/", "/*/cart", "/*/favorites"]),
        });
    });
});
