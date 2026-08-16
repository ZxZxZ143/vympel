import {describe, expect, it} from "vitest";
import type {ICmsBlock} from "@/api/types/CmsTypes";
import {cmsAboutInstagramPosts, resolveAboutInstagramPosts} from "@/utils/aboutInstagramPosts";
import {LocaleEnum} from "@/i18n/routing";

function cmsPost(id: number, sortOrder: number, overrides: Partial<ICmsBlock> = {}): ICmsBlock {
    return {
        id,
        pageKey: "about",
        blockKey: `about.instagram.${id}`,
        blockType: "INSTAGRAM_POST",
        sortOrder,
        settingsJson: null,
        media: {
            id,
            storageType: "OBJECT_STORAGE",
            publicUrl: null,
            url: `/media/post-${id}.webp`,
            originalFilename: null,
            contentType: "image/webp",
            sizeBytes: 100,
            createdAt: null,
        },
        mediaKz: null,
        mediaEn: null,
        mobileMedia: null,
        mobileMediaKz: null,
        mobileMediaEn: null,
        linkType: "EXTERNAL_URL",
        linkTarget: `https://instagram.com/p/post_${id}`,
        linkOpenBehavior: "NEW_TAB",
        translation: {
            lang: LocaleEnum.RU,
            title: null,
            subtitle: null,
            description: null,
            buttonText: null,
            altText: `CMS alt ${id}`,
            extraJson: null,
        },
        updatedAt: null,
        ...overrides,
    };
}

describe("About Instagram CMS resolution", () => {
    it("uses only valid CMS posts in configured sort order", () => {
        const posts = cmsAboutInstagramPosts([
            cmsPost(2, 20),
            cmsPost(3, 30, {linkTarget: "https://evil.test/p/post_3"}),
            cmsPost(1, 10),
        ], (position) => `Fallback ${position}`);

        expect(posts.map((post) => post.id)).toEqual(["cms-1", "cms-2"]);
        expect(posts[0]).toMatchObject({
            src: "/media/post-1.webp",
            alt: "CMS alt 1",
            href: "https://www.instagram.com/p/post_1/",
        });
    });

    it("never mixes the four static fallbacks with CMS posts", () => {
        const cmsPosts = cmsAboutInstagramPosts([cmsPost(1, 10)], (position) => `Fallback ${position}`);
        expect(resolveAboutInstagramPosts(cmsPosts, (position) => `Fallback ${position}`)).toEqual(cmsPosts);

        const fallback = resolveAboutInstagramPosts([], (position) => `Fallback ${position}`);
        expect(fallback).toHaveLength(4);
        expect(fallback.every((post) => post.id.startsWith("fallback-") && post.href === null)).toBe(true);
    });
});
