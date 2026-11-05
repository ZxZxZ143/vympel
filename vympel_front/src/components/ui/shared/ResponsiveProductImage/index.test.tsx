import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {describe, expect, it} from "vitest";
import ResponsiveProductImage from ".";
import {PRODUCT_CARD_SIZES} from "@/utils/responsiveImages";

const original = `https://api.vympel.kz/media/vympel-staging/product/responsive-v1/12345678-1234-1234-1234-123456789012/${"a".repeat(64)}/1086x1448/original.png`;
describe("deferred carousel resources in SSR", () => {
    it("keeps the responsive family and geometry in a no-JS fallback without preloads", () => {
        const html = renderToStaticMarkup(<ResponsiveProductImage src={original} alt="Watch" width={270} height={370} sizes={PRODUCT_CARD_SIZES} loadImage={false}/>);
        expect(html).toMatch(/^<noscript><img /);
        expect(html).toContain('w320.webp 320w');
        expect(html).toContain('w1086.webp 1086w');
        expect(html).toContain(`sizes="${PRODUCT_CARD_SIZES}"`);
        expect(html).toContain('alt="Watch"');
        expect(html).toContain('width="270" height="370"');
        expect(html).not.toContain('rel="preload"');
    });
    it("leaves ordinary grid images and explicit priorities unchanged", () => {
        const grid = renderToStaticMarkup(<ResponsiveProductImage src="/legacy.png" alt="Watch"/>);
        expect(grid).toMatch(/^<img /);
        expect(grid).toContain('loading="lazy"');
        const priority = renderToStaticMarkup(<ResponsiveProductImage src={original} alt="Watch" priority/>);
        expect(priority).toContain('loading="eager"');
        expect(priority).toContain('fetchPriority="high"');
    });
});
