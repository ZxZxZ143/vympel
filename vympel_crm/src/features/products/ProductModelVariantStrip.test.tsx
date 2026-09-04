import React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ProductModelVariantStrip } from "./ProductModelVariantStrip";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("@/shared/i18n/useI18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const group = {
  model: "TL4247HM",
  total: 3,
  truncated: false,
  variants: [
    { id: 12, name: "Black", model: "TL4247HM", status: "ACTIVE" as const, mainImage: null },
    {
      id: 13,
      name: "White",
      model: "TL4247HM",
      status: "DRAFT" as const,
      mainImage: { id: 2, url: "https://media.test/white.jpg", sortOrder: 0, isMain: true },
    },
    { id: 14, name: "Brown", model: "TL4247HM", status: "ARCHIVED" as const, mainImage: null },
  ],
};

const variantHrefs = (markup: string) => (
  [...markup.matchAll(/<a[^>]*href="([^"]+)"/g)].map((match) => match[1])
);

describe("ProductModelVariantStrip", () => {
  it("hides a group without siblings", () => {
    expect(renderToStaticMarkup(
      <ProductModelVariantStrip
        currentProductId={12}
        group={{ ...group, total: 1, variants: [group.variants[0]] }}
      />
    )).toBe("");
  });

  it.each([12, 13, 14])("keeps canonical variant order when product %s is current", (currentProductId) => {
    const markup = renderToStaticMarkup(
      <ProductModelVariantStrip currentProductId={currentProductId} group={group}/>
    );

    expect(variantHrefs(markup)).toEqual(["/products/12", "/products/13", "/products/14"]);
    const currentLink = markup.match(/<a[^>]*aria-current="page"[^>]*>/)?.[0] ?? "";
    expect(currentLink).toContain(`href="/products/${currentProductId}"`);
  });

  it("keeps every variant independently editable with one token-backed black selected border", () => {
    const markup = renderToStaticMarkup(
      <ProductModelVariantStrip currentProductId={13} group={group}/>
    );

    expect(markup).toContain('href="/products/12"');
    expect(markup).toContain('href="/products/13"');
    expect(markup).toContain("https://media.test/white.jpg");
    expect(markup).toContain("crm-model-variants__fallback");
    expect(markup.match(/aria-current="page"/g)).toHaveLength(1);
    const selected = markup.match(/<a[^>]*aria-current="page"[^>]*>/)?.[0] ?? "";
    expect(selected).toContain("crm-model-variants__tile--selected");

    const styles = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");
    const baseRule = styles.match(/\.crm-model-variants__tile \{[^}]+\}/)?.[0] ?? "";
    const selectedRule = styles.match(/\.crm-model-variants__tile--selected \{[^}]+\}/)?.[0] ?? "";
    const focusRule = styles.match(/\.crm-model-variants__tile:focus-visible \{[^}]+\}/)?.[0] ?? "";
    expect(baseRule).toContain("border: 1px solid var(--crm-color-border-soft)");
    expect(baseRule).toContain("border-radius: var(--crm-radius-md)");
    expect(selectedRule).toContain("border-color: var(--crm-color-text)");
    expect(selectedRule).not.toMatch(/box-shadow|orange|red/i);
    expect(focusRule).toContain("border-color: transparent");
    expect(focusRule).toContain("outline-offset: -2px");
  });
});
