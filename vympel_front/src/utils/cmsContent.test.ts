import {describe, expect, it} from "vitest";

import type {ICmsBlock} from "@/api/types/CmsTypes";
import {MARKETPLACE_LINKS} from "@/config/routes";
import {cmsLink} from "@/utils/cmsContent";

function externalBlock(linkTarget: string, linkOpenBehavior: ICmsBlock["linkOpenBehavior"] = "SAME_TAB"): ICmsBlock {
    return {
        id: 1,
        pageKey: "home",
        blockKey: "test.external",
        blockType: "MARKETPLACE_LINK",
        sortOrder: 1,
        settingsJson: null,
        media: null,
        mediaKz: null,
        mediaEn: null,
        mobileMedia: null,
        mobileMediaKz: null,
        mobileMediaEn: null,
        linkType: "EXTERNAL_URL",
        linkTarget,
        linkOpenBehavior,
        translation: null,
        updatedAt: null,
    };
}

describe("CMS marketplace links", () => {
    it("uses canonical destinations and always opens marketplace links in a new tab", () => {
        expect(cmsLink(externalBlock("https://kaspi.kz/shop/p/legacy"))).toEqual({
            href: MARKETPLACE_LINKS.kaspi,
            external: true,
            newTab: true,
        });
        expect(cmsLink(externalBlock("https://www.wildberries.ru/catalog/legacy"))).toEqual({
            href: MARKETPLACE_LINKS.wildberries,
            external: true,
            newTab: true,
        });
    });

    it("does not expose Ozon links from CMS data", () => {
        expect(cmsLink(externalBlock("https://www.ozon.ru/product/legacy"))).toBeNull();
    });

    it("preserves unrelated external links and their configured behavior", () => {
        expect(cmsLink(externalBlock("https://example.com/page"))).toEqual({
            href: "https://example.com/page",
            external: true,
            newTab: false,
        });
    });
});
