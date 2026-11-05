import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {describe, expect, it, vi} from "vitest";
import GoodsCarouselWithImage from ".";
import ResponsiveProductImage from "../ResponsiveProductImage";
import Link from "next/link";

vi.mock("use-intl", () => ({useTranslations: () => (key: string) => key}));
vi.mock("@/components/GoodCard", () => ({default: ({img, name, loadImage}: {img: string; name: string; loadImage: boolean}) =>
    <article><Link href="/product/1">{name}</Link><ResponsiveProductImage src={img} alt={name} loadImage={loadImage}/></article>}));

const items = Array.from({length: 12}, (_, id) => ({id, name: `Product ${id}`, img: `/image-${id}.png`, price: 100}));
describe("goods carousel SSR progressive enhancement", () => {
    it("retains all content and links with only four discoverable images before JS", () => {
        const html = renderToStaticMarkup(<GoodsCarouselWithImage items={items} showBanner={false}/>);
        expect(html.match(/<article>/g)).toHaveLength(12);
        expect(html.match(/<noscript>/g)).toHaveLength(8);
        const scripted = html.replace(/<noscript>.*?<\/noscript>/g, "");
        expect(scripted.match(/<img /g)).toHaveLength(4);
        expect(scripted).not.toContain('src="/image-4.png"');
        expect(html).not.toContain('inert=""');
        expect(html).not.toContain('aria-hidden="true"');
        expect(html).toContain('overflow-x-auto');
    });
    it("handles empty and short rails without hiding available images", () => {
        expect(renderToStaticMarkup(<GoodsCarouselWithImage items={[]} showBanner={false}/>)).toBe("");
        expect(renderToStaticMarkup(<GoodsCarouselWithImage items={undefined} showBanner={false}/>)).toBe("");
        const html = renderToStaticMarkup(<GoodsCarouselWithImage items={items.slice(0, 2)} showBanner={false}/>);
        expect(html.match(/<img /g)).toHaveLength(2);
        expect(html).not.toContain('<noscript>');
    });
});
