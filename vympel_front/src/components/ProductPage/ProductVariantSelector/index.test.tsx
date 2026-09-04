/* eslint-disable @next/next/no-img-element -- the Next Image test double must render plain markup. */
import React from "react";
import {readFileSync} from "node:fs";
import {renderToStaticMarkup} from "react-dom/server";
import {describe, expect, it, vi} from "vitest";

import ProductVariantSelector from "./index";

vi.mock("use-intl", () => ({
    useTranslations: () => (key: string, values?: Record<string, string | number>) => (
        values ? `${key}:${Object.values(values).join(":")}` : key
    ),
}));

vi.mock("next/image", () => ({
    default: ({
        src,
        alt,
        className,
        unoptimized,
    }: {
        src: string;
        alt: string;
        className?: string;
        unoptimized?: boolean;
    }) => (
        <img
            src={src}
            alt={alt}
            className={className}
            data-unoptimized={unoptimized ? "true" : "false"}
        />
    ),
}));

vi.mock("@/i18n/navigation", () => ({
    Link: ({href, children, ...props}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {href: string}) => (
        <a href={href} {...props}>{children}</a>
    ),
}));

const group = {
    model: "TL4247HM",
    total: 3,
    truncated: false,
    variants: [
        {
            id: 12,
            name: "Romanson TL4247HM Black",
            model: "TL4247HM",
            status: "ACTIVE",
            mainImage: {id: 101, url: "https://media.test/black.jpg", sortOrder: 0, isMain: true},
        },
        {
            id: 13,
            name: "Romanson TL4247HM White",
            model: "TL4247HM",
            status: "ACTIVE",
            mainImage: {id: 102, url: "https://media.test/white.jpg", sortOrder: 0, isMain: true},
        },
        {
            id: 14,
            name: "Romanson TL4247HM Brown",
            model: "TL4247HM",
            status: "ACTIVE",
            mainImage: null,
        },
    ],
};

const variantHrefs = (markup: string) => (
    [...markup.matchAll(/<a[^>]*href="([^"]+)"/g)].map((match) => match[1])
);

describe("ProductVariantSelector", () => {
    it("hides a one-product group", () => {
        const markup = renderToStaticMarkup(
            <ProductVariantSelector
                currentProductId={12}
                group={{...group, total: 1, variants: [group.variants[0]]}}
            />
        );

        expect(markup).toBe("");
    });

    it("renders localized accessible sibling links and a missing-image fallback", () => {
        const markup = renderToStaticMarkup(
            <ProductVariantSelector currentProductId={12} group={group}/>
        );

        expect(markup).toContain('aria-label="groupAria:TL4247HM"');
        expect(markup).toContain('href="/product/13"');
        expect(markup).toContain('aria-label="optionAria:Romanson TL4247HM White"');
        expect(markup).toContain("https://media.test/white.jpg");
        expect(markup.match(/data-unoptimized="true"/g)).toHaveLength(2);
        expect(markup).toContain("product-image-fallback--compact");
        expect(markup).toContain("overflow-x-auto");
    });

    it.each([12, 13, 14])("keeps canonical variant order when product %s is current", (currentProductId) => {
        const markup = renderToStaticMarkup(
            <ProductVariantSelector currentProductId={currentProductId} group={group}/>
        );

        expect(variantHrefs(markup)).toEqual(["/product/12", "/product/13", "/product/14"]);
        const currentLink = markup.match(/<a[^>]*aria-current="page"[^>]*>/)?.[0] ?? "";
        expect(currentLink).toContain(`href="/product/${currentProductId}"`);
    });

    it("marks only the current route with one token-backed black selected border", () => {
        const markup = renderToStaticMarkup(
            <ProductVariantSelector currentProductId={13} group={group}/>
        );

        expect(markup.match(/aria-current="page"/g)).toHaveLength(1);
        const currentLink = markup.match(/<a[^>]*aria-current="page"[^>]*>/)?.[0] ?? "";
        expect(currentLink).toContain("product-variant-tile--selected");
        expect(currentLink).toContain('href="/product/13"');
        expect(markup).not.toContain("ring-");

        const styles = readFileSync(new URL("../../../app/globals.css", import.meta.url), "utf8");
        const baseRule = styles.match(/\.product-variant-tile \{[^}]+\}/)?.[0] ?? "";
        const selectedRule = styles.match(
            /\.product-variant-tile--selected,\s*\.product-variant-tile--selected:hover \{[^}]+\}/
        )?.[0] ?? "";
        const focusRule = styles.match(/\.product-variant-tile:focus-visible \{[^}]+\}/)?.[0] ?? "";
        expect(baseRule).toContain("border: 1px solid var(--color-border-default)");
        expect(baseRule).toContain("border-radius: var(--radius-md)");
        expect(selectedRule).toContain("border-color: var(--color-text-primary)");
        expect(selectedRule).not.toMatch(/box-shadow|orange|red/i);
        expect(focusRule).toContain("border-color: transparent");
        expect(focusRule).toContain("outline-offset: -2px");
    });
});
