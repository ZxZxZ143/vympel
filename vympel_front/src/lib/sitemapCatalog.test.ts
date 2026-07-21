import {describe, expect, it} from "vitest";

import {buildSitemap, fetchSitemapCatalog} from "./sitemapCatalog";

describe("storefront sitemap", () => {
    it("includes localized static, category, brand, and active product routes", () => {
        const urls = buildSitemap({
            categories: [{id: 10, code: "WATCH_WRIST", name: "Watches", parentId: null}],
            products: [
                {id: 41, name: "Active", price: 1, status: "ACTIVE", collection: {id: "1", name: "C"}},
                {id: 42, name: "Draft", price: 1, status: "DRAFT", collection: {id: "1", name: "C"}},
            ],
        }, new URL("https://shop.example.test"));
        const values = urls.map((entry) => entry.url);

        expect(values).toContain("https://shop.example.test/ru/catalog/WATCH_WRIST");
        expect(values).toContain("https://shop.example.test/kz/brands/romanson");
        expect(values).toContain("https://shop.example.test/en/product/41");
        expect(values).not.toContain("https://shop.example.test/en/product/42");
        expect(values.some((url) => url.includes("/crm"))).toBe(false);
    });

    it("fails instead of emitting a partial successful sitemap when the backend is unavailable", async () => {
        const failingFetch = async () => { throw new Error("offline"); };
        await expect(fetchSitemapCatalog("https://api.example.test/api/public", failingFetch as typeof fetch))
            .rejects.toThrow(/unavailable/);
    });

    it("requires the backend URL", async () => {
        await expect(fetchSitemapCatalog("", fetch)).rejects.toThrow(/required/);
    });
});
