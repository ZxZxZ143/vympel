import {describe, expect, it} from "vitest";

import {LocaleEnum} from "@/i18n/routing";
import {brandSeoContent, categorySeoContent, productSeoContent, staticSeoContent} from "./seoContent";

describe("localized SEO content", () => {
    it("provides complete distinct static metadata for every locale", () => {
        const pages = ["home", "about", "brands", "catalog", "delivery", "payment", "guarantee"] as const;
        for (const locale of [LocaleEnum.RU, LocaleEnum.KZ, LocaleEnum.EN]) {
            const titles = new Set<string>();
            const descriptions = new Set<string>();
            for (const page of pages) {
                const content = staticSeoContent(locale, page);
                expect(content.title).not.toBe("");
                expect(content.description).not.toBe("");
                titles.add(content.title);
                descriptions.add(content.description);
            }
            expect(titles.size).toBe(pages.length);
            expect(descriptions.size).toBe(pages.length);
        }
        expect(staticSeoContent(LocaleEnum.RU, "home").title)
            .toBe("Vympel — официальный дистрибьютор премиальных часов");
        expect(staticSeoContent(LocaleEnum.KZ, "home").title)
            .toBe("Vympel — премиум сағаттардың ресми дистрибьюторы");
        expect(staticSeoContent(LocaleEnum.EN, "home").title)
            .toBe("Vympel — official distributor of premium watches");
        expect(staticSeoContent(LocaleEnum.EN, "home").description).not.toMatch(/[А-Яа-яӘәҒғҚқҢңӨөҰұҮүҺһІі]/);
        expect(staticSeoContent(LocaleEnum.KZ, "home").description).not.toBe(staticSeoContent(LocaleEnum.RU, "home").description);
    });

    it("uses trusted localized category and brand content", () => {
        expect(categorySeoContent(LocaleEnum.EN, "Wrist watches").title).toContain("Wrist watches");
        expect(brandSeoContent(LocaleEnum.RU, "ROMANSON", "Visible brand description")).toEqual({
            title: "ROMANSON — часы | Vympel",
            description: "Visible brand description",
        });
        expect(brandSeoContent(LocaleEnum.KZ, "ROMANSON", "Көрінетін бренд сипаттамасы").title)
            .toBe("ROMANSON — сағаттар | Vympel");
        expect(brandSeoContent(LocaleEnum.EN, "ROMANSON", "Visible brand description").title)
            .toBe("ROMANSON watches | Vympel");
    });

    it("builds product metadata from real fields without duplicate identity tokens", () => {
        const product = productSeoContent(LocaleEnum.EN, {
            name: "Romanson TM9A19MMW(BK)",
            model: "TM9A19MMW(BK)",
            brand: {name: "Romanson"},
            description: {
                shortText: "<p>Original <strong>men's watch</strong> &amp; warranty support.</p>",
            },
        });
        expect(product.title).toBe("Romanson TM9A19MMW(BK) — Vympel");
        expect(product.description).toBe("Original men's watch & warranty support.");
        expect(product.description).not.toMatch(/[<>*_`]|\s{2,}/);
    });

    it("adds missing brand and model and shortens descriptions at a word boundary", () => {
        const product = productSeoContent(LocaleEnum.EN, {
            name: "Classic",
            model: "M-1",
            brand: {name: "Romanson"},
            description: {content: `[Collection](https://example.test) ${"reliable mechanical watch ".repeat(12)}final word`},
        });
        expect(product.title).toBe("Romanson M-1 Classic — Vympel");
        expect(product.description.length).toBeLessThanOrEqual(160);
        expect(product.description).toMatch(/…$/);
        expect(product.description).not.toMatch(/mechanica…$/);
    });

    it("uses a truthful localized fallback only when product description is absent", () => {
        const product = productSeoContent(LocaleEnum.EN, {name: "Model One", model: "M-1", description: null});
        expect(product.title).toContain("Model One M-1");
        expect(product.description).toContain("Model One");
        expect(product.description).not.toMatch(/price|rating|stock/i);
    });
});
