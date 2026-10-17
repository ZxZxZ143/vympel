import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {describe, expect, it, vi} from "vitest";
import ProductPrice from "./index";
import GoodCard from "@/components/GoodCard";
import ProductSummary from "@/components/ProductPage/ProductSummary";
import type {IProductDetails} from "@/api/types/ProductTypes";
import {customerPrice} from "@/utils/productPricing";
import {createProductSnapshotFromBatchSummary} from "@/services/localProductStorage";
import {buildWhatsAppOrderMessage} from "@/utils/cartCheckout";

vi.mock("use-intl", () => ({useLocale: () => "en", useTranslations: () => (key: string, values?: Record<string, unknown>) => `${key} ${JSON.stringify(values ?? {})}`}));

vi.mock("@/hooks/useProductActionToasts", () => ({useProductActionToasts: () => ({})}));
vi.mock("@/components/CustomerRequestDialog/CustomerRequestButton", () => ({default: () => null}));
vi.mock("@/i18n/navigation", () => ({Link: ({href, children, ...props}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {href: string}) => <a href={href} {...props}>{children}</a>}));

describe("shared product discount pricing", () => {
    it("renders identical effective prices in actual cards and product details", () => {
        const product: IProductDetails = {id:1, name:"Watch", model:"Model", sku:"SKU", productType:"WATCH", status:"ACTIVE", price:1001, discountPercent:50, finalPrice:501, stockQuantity:5, images:[]};
        const card = renderToStaticMarkup(<GoodCard id={product.id} name={product.name} price={product.price} discountPercent={product.discountPercent} finalPrice={product.finalPrice}/>);
        expect(card.match(/product-price__badge/g)).toHaveLength(1);
        expect(card.indexOf("product-card-discount")).toBeLessThan(card.indexOf("data-favorite-product-id"));
        const detail = renderToStaticMarkup(<ProductSummary product={product}/>);
        for (const html of [card, detail]) {
            expect(html).toContain("−50%");
            expect(html).toContain('value="501"');
            expect(html).toContain("<del");
        }
        const ordinary = renderToStaticMarkup(<ProductSummary product={{...product,discountPercent:null,finalPrice:1001}}/>);
        expect(ordinary).not.toContain("product-price__badge");
        expect(ordinary).toContain('value="1001"');
    });
    it("renders restrained badge, original and authoritative final price", () => {
        const html = renderToStaticMarkup(<ProductPrice price={1001} discountPercent={50} finalPrice={501}/>);
        expect(html).toContain("<del");
        expect(html).toContain("−50%");
        expect(html).toContain('value="501"');
        expect(html).toContain("₸");
        expect(html.indexOf("<data")).toBeLessThan(html.indexOf("<del"));
    });
    it("has no discount decoration without a discount or for invalid values", () => {
        for (const discountPercent of [null, undefined, 0, -1, 100, 1.5]) {
            const html = renderToStaticMarkup(<ProductPrice price={1001} discountPercent={discountPercent}/>);
            expect(html).not.toContain("<del");
            expect(html).not.toContain("product-price__badge");
            expect(html).toContain('value="1001"');
        }
    });
    it("preserves base and discount in refreshed favorites/cart snapshots and clears them", () => {
        const discounted = createProductSnapshotFromBatchSummary({id: 1, name: "Watch", sku: "SKU", price: 1001, discountPercent: 50, finalPrice: 501, stockQuantity: 3});
        expect(discounted).toMatchObject({price: 1001, discountPercent: 50, finalPrice: 501});
        expect(customerPrice(discounted)).toBe(501);
        const cleared = createProductSnapshotFromBatchSummary({id: 1, name: "Watch", price: 1001, discountPercent: null, finalPrice: 1001});
        expect(customerPrice(cleared)).toBe(1001);
        const order = buildWhatsAppOrderMessage([{productId:1, snapshot:discounted, quantity:2, updatedAt:1}], {
            locale:"en",currencySymbol:"₸",labels:{greeting:"Hello",quantity:"Quantity",unitPrice:"Unit",lineTotal:"Line",article:"SKU",total:"Total",piece:"pcs"},
        });
        expect(order).toContain("Unit: 501");
        expect(order).toContain("Total: 1,002");
        expect(order).not.toContain("Unit: 1,001");
    });
    it("handles whole-tenge rounding and legacy snapshots", () => {
        expect(customerPrice({price:1001,discountPercent:50})).toBe(501);
        expect(customerPrice({price:1001})).toBe(1001);
        expect(customerPrice({price:1001,discountPercent:null,finalPrice:501})).toBe(1001);
    });
});
