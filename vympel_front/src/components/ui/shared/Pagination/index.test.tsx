import {renderToStaticMarkup} from "react-dom/server";
import {describe, expect, it, vi} from "vitest";
import type {ReactNode} from "react";
import {normalizePageResponse} from "@/api/types/PageType";
import Pagination from ".";

vi.mock("next/navigation", () => ({useSearchParams: () => new URLSearchParams("search=model&sort=priceAsc&brand=1")}));
vi.mock("@/i18n/navigation", () => ({usePathname: () => "/catalog", Link: ({href, children, prefetch: _prefetch, ...props}: {href: string; children: ReactNode; prefetch?: boolean}) => { void _prefetch; return <a href={`/ru${href}`} {...props}>{children}</a>; }}));
vi.mock("use-intl", () => ({useTranslations: () => (key: string, values?: {page?: number; range?: string}) => values?.range ? `Items ${values.range}` : values?.page ? `Page ${values.page}` : key}));

function render(count: number, page: number, size: number) {
    return renderToStaticMarkup(<Pagination pageData={normalizePageResponse({content: [], number: page - 1,
        size, totalElements: count, totalPages: Math.ceil(count / size)})} scrollTargetId="products"/>);
}

function links(html: string, group: "ranges" | "pages") {
    const section = html.split(`data-pagination-group="${group}"`)[1]?.split('data-pagination-group="pages"')[0] ?? "";
    return [...section.matchAll(/<a\b([^>]*)>(.*?)<\/a>/g)].flatMap((match) => {
        const attr = (key: string) => match[1].match(new RegExp(`${key}="([^"]*)"`))?.[1];
        const value = attr("data-index");
        return value ? [{page: Number(value), label: match[2], href: attr("href"), active: attr("aria-current") === "page", name: attr("aria-label")}] : [];
    });
}

function tokens(html: string, group: "ranges" | "pages") {
    const section = html.split(`data-pagination-group="${group}"`)[1]?.split('data-pagination-group="pages"')[0] ?? "";
    return [...section.matchAll(/<([a-z]+)\b([^>]*\bdata-part="(item|ellipsis)"[^>]*)>/g)].map((match) => {
        if (match[3] === "ellipsis") {
            expect(["a", "button"]).not.toContain(match[1]);
            expect(match[2]).toContain('aria-hidden="true"');
            expect(match[2]).not.toContain("tabindex");
            return "…";
        }
        return Number(match[2].match(/data-index="(\d+)"/)?.[1]);
    });
}

describe("shared complete Ark pagination window", () => {
    for (const size of [9, 15]) it.each([0, 1, size])(`hides for %i results at size ${size}`, (count) => expect(render(count, 1, size)).toBe(""));
    for (const size of [9, 15]) for (const pages of [2, 3, 5, 7, 12, 100]) {
        for (const current of new Set([1, 2, Math.ceil(pages / 2), pages - 1, pages])) {
            it(`shares complete window: size ${size}, ${pages} pages, current ${current}`, () => {
                const total = pages * size - 1;
                const html = render(total, current, size);
                const ranges = links(html, "ranges"), numbers = links(html, "pages");
                const left = tokens(html, "ranges"), right = tokens(html, "pages");
                expect(left).toEqual(right);
                expect(left[0]).toBe(1); expect(left.at(-1)).toBe(pages);
                for (const page of [current - 1, current, current + 1].filter((page) => page >= 1 && page <= pages)) expect(left).toContain(page);
                for (let index = 1; index < left.length - 1; index++) if (left[index] === "…") {
                    expect(typeof left[index - 1]).toBe("number");
                    expect(typeof left[index + 1]).toBe("number");
                    expect(Number(left[index + 1]) - Number(left[index - 1])).toBeGreaterThan(2);
                }
                for (let index = 1; index < left.length; index++) if (typeof left[index - 1] === "number" && typeof left[index] === "number") {
                    expect(Number(left[index]) - Number(left[index - 1])).toBe(1);
                }
                expect(html.match(/<nav /g)).toHaveLength(1);
                expect(ranges.filter((link) => link.active).map((link) => link.page)).toEqual([current]);
                expect(numbers.filter((link) => link.active).map((link) => link.page)).toEqual([current]);
                const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((match) => match[1]);
                expect(new Set(ids).size).toBe(ids.length);
                expect(new Set(ranges.map((link) => link.page)).size).toBe(ranges.length);
                for (const range of ranges) {
                    const first = (range.page - 1) * size + 1, last = Math.min(range.page * size, total);
                    const label = first === last ? String(first) : `${first}–${last}`;
                    expect(range.label).toBe(label); expect(range.name).toBe(`Items ${label}`);
                    expect(range.href).toBe(numbers.find((link) => link.page === range.page)?.href);
                    expect(range.href).toContain("search=model&amp;sort=priceAsc&amp;brand=1");
                    expect(range.href).toContain("#products");
                }
                const rangeSection = html.split('data-pagination-group="ranges"')[1].split('data-pagination-group="pages"')[0];
                expect(rangeSection).not.toContain('data-part="prev-trigger"');
                expect(rangeSection).not.toContain('data-part="next-trigger"');
                expect(html.includes('data-part="prev-trigger"')).toBe(current > 1);
                expect(html.includes('data-part="next-trigger"')).toBe(current < pages);
                expect(html).not.toContain("page=0");expect(html).not.toContain("page=1&amp;");
            });
        }
    }
    it("keeps SSR navigation data while using CSS to hide mobile ranges and arrows", () => {
        const html = render(100, 7, 9);
        expect(html).toContain("hidden w-full min-w-0 overflow-x-auto lg:block");
        const arrowTags = [...html.matchAll(/<a[^>]*data-part="(?:prev|next)-trigger"[^>]*>/g)];
        expect(arrowTags).toHaveLength(2);
        expect(arrowTags.every(([tag]) => tag.includes("hidden lg:flex"))).toBe(true);
        expect(html).toContain("flex-nowrap");
        expect(html).toContain("--pagination-mobile-size");
        expect(tokens(html, "pages")).toEqual([1, "…", 6, 7, 8, "…", 12]);
    });
    it("maps the middle-page boundaries and ellipses directly from Ark", () => {
        const html = render(100, 7, 9);
        expect(tokens(html, "ranges")).toEqual([1, "…", 6, 7, 8, "…", 12]);
        expect(links(html, "ranges").map((link) => link.label)).toEqual(["1–9", "46–54", "55–63", "64–72", "100"]);
    });
    it("shows intervening pages rather than unnecessary ellipses in short lists", () => {
        for (let current = 1; current <= 7; current++) expect(tokens(render(63, current, 9), "ranges")).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });
    it.each([[100, 12, 9, "100"], [57, 4, 15, "46–57"], [35, 3, 15, "31–35"]] as const)(
        "bounds the final range for %i products", (total, page, size, expected) => {
            expect(links(render(total, page, size), "ranges").find((link) => link.active)?.label).toBe(expected);
        },
    );
});
