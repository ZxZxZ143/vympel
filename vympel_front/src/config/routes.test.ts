import {describe, expect, it} from "vitest";

import {MARKETPLACE_LINKS, resolveMarketplaceHref, routes} from "@/config/routes";
import {MarketPlacesConfig} from "@/components/MarketPlaces/config";

const kaspiUrl = "https://kaspi.kz/shop/m/1433003/products?productCode=110688026&masterSku=110688026&merchantSku=AM%2b003%2bH%2bBRONZE&tabId=PRODUCT&started_by=shop_product&ref=shared_link&sessionId=b58a609e-9e07-4c3b-b683-fcf5ccec61d51785317673&link_source=chrome";
const wildberriesUrl = "https://global.wildberries.ru/seller/4398117";

describe("marketplace link contract", () => {
    it("exposes only the canonical Kaspi and Wildberries destinations", () => {
        expect(MARKETPLACE_LINKS).toEqual({
            kaspi: kaspiUrl,
            wildberries: wildberriesUrl,
        });
        expect(MarketPlacesConfig.map(({id, link}) => ({id, link}))).toEqual([
            {id: "kaspi", link: kaspiUrl},
            {id: "wildberries", link: wildberriesUrl},
        ]);
    });

    it("canonicalizes legacy CMS marketplace URLs and blocks Ozon", () => {
        expect(resolveMarketplaceHref(new URL("https://kaspi.kz/shop/p/old-product"))).toBe(kaspiUrl);
        expect(resolveMarketplaceHref(new URL("https://www.wildberries.ru/catalog/123/detail.aspx"))).toBe(wildberriesUrl);
        expect(resolveMarketplaceHref(new URL("https://www.ozon.ru/product/123"))).toBeNull();
        expect(resolveMarketplaceHref(new URL("https://example.com/marketplace"))).toBeUndefined();
    });
});

describe("catalog route helpers", () => {
    it("uses one encoded path URL for categories", () => {
        expect(routes.category("WATCH_WRIST")).toBe("/catalog/WATCH_WRIST");
        expect(routes.category("WATCH WRIST")).toBe("/catalog/WATCH%20WRIST");
        expect(routes.filteredCatalog({categoryCode: "WATCH_WRIST", page: 2, filters: {gender: "1"}}))
            .toBe("/catalog/WATCH_WRIST?gender=1&page=2");
    });

    it("strips default page and sort while preserving canonical query order", () => {
        expect(routes.catalog({page: 1, sort: "priceAsc"})).toBe("/catalog");
        expect(routes.catalog({page: 2, sort: "priceDesc", search: "moon"}))
            .toBe("/catalog?page=2&search=moon&sort=priceDesc");
    });
});
