import {describe, expect, it} from "vitest";

import {LocaleEnum} from "@/i18n/routing";
import {brandSeoContent, categorySeoContent, productSeoContent, staticSeoContent} from "./seoContent";

describe("localized SEO content", () => {
    it("provides complete distinct static metadata for every locale", () => {
        const pages = ["home", "about", "brands", "catalog", "delivery", "payment", "guarantee"] as const;
        for (const locale of [LocaleEnum.RU, LocaleEnum.KZ, LocaleEnum.EN]) {
            for (const page of pages) {
                const content = staticSeoContent(locale, page);
                expect(content.title).not.toBe("");
                expect(content.description).not.toBe("");
            }
        }
        expect(staticSeoContent(LocaleEnum.EN, "home").description).not.toMatch(/[А-Яа-я]/);
        expect(staticSeoContent(LocaleEnum.KZ, "home").description).not.toBe(staticSeoContent(LocaleEnum.RU, "home").description);
    });

    it("uses trusted category, brand, and product content", () => {
        expect(categorySeoContent(LocaleEnum.EN, "Wrist watches").title).toContain("Wrist watches");
        expect(brandSeoContent("ROMANSON", "Visible brand description").description).toBe("Visible brand description");
        const product = productSeoContent(LocaleEnum.EN, {name: "Model One", model: "M-1", description: null});
        expect(product.title).toContain("Model One M-1");
        expect(product.description).toContain("Model One");
        expect(product.description).not.toMatch(/price|rating|stock/i);
    });
});
