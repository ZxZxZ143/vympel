import {describe, expect, it} from "vitest";

import {shouldStartNavigationProgress} from "./navigationProgressPolicy";

const currentUrl = "https://shop.example.com/ru/catalog?sort=price#products";

function intent(overrides: Partial<Parameters<typeof shouldStartNavigationProgress>[0]> = {}) {
    return {
        currentUrl,
        href: "/ru/product/42",
        ...overrides,
    };
}

describe("shouldStartNavigationProgress", () => {
    it("starts for internal path and query-string changes", () => {
        expect(shouldStartNavigationProgress(intent())).toBe(true);
        expect(shouldStartNavigationProgress(intent({href: "/ru/catalog?sort=name"}))).toBe(true);
        expect(shouldStartNavigationProgress(intent({href: "/ru/catalog?sort=name#products"}))).toBe(true);
        expect(shouldStartNavigationProgress(intent({href: "/ru/product/42", target: "_self"}))).toBe(true);
    });

    it("ignores the current URL and hash-only navigation", () => {
        expect(shouldStartNavigationProgress(intent({href: currentUrl}))).toBe(false);
        expect(shouldStartNavigationProgress(intent({href: "#filters"}))).toBe(false);
        expect(shouldStartNavigationProgress(intent({href: "/ru/catalog?sort=price#another"}))).toBe(false);
    });

    it("ignores external and non-web destinations", () => {
        expect(shouldStartNavigationProgress(intent({href: "https://example.org/ru/catalog"}))).toBe(false);
        expect(shouldStartNavigationProgress(intent({href: "mailto:sales@example.com"}))).toBe(false);
        expect(shouldStartNavigationProgress(intent({href: "tel:+77000000000"}))).toBe(false);
        expect(shouldStartNavigationProgress(intent({href: "http://[invalid"}))).toBe(false);
    });

    it("ignores clicks that do not replace the current document", () => {
        expect(shouldStartNavigationProgress(intent({target: "_blank"}))).toBe(false);
        expect(shouldStartNavigationProgress(intent({target: "named-frame"}))).toBe(false);
        expect(shouldStartNavigationProgress(intent({download: true}))).toBe(false);
        expect(shouldStartNavigationProgress(intent({defaultPrevented: true}))).toBe(false);
        expect(shouldStartNavigationProgress(intent({button: 1}))).toBe(false);
    });

    it.each([
        ["meta", {metaKey: true}],
        ["control", {ctrlKey: true}],
        ["shift", {shiftKey: true}],
        ["alt", {altKey: true}],
    ])("ignores %s-modified clicks", (_name, modifier) => {
        expect(shouldStartNavigationProgress(intent(modifier))).toBe(false);
    });
});
