import {describe, expect, it} from "vitest";
import type {IProductDetails} from "@/api/types/ProductTypes";
import {buildBreadcrumbStructuredData, buildProductStructuredData, serializeJsonLd} from "./structuredData";

const product: IProductDetails = {
    id: 7,
    sku: "SKU-7",
    model: "M7",
    name: "Watch <Seven>",
    price: 125000,
    stockQuantity: 2,
    status: "ACTIVE",
    productType: "WATCH",
    brand: {id: "1", name: "Romanson"},
    images: [{id: 1, url: "https://media.example.com/7.webp", alt: null, sortOrder: 0, isMain: true}],
    description: {shortText: "Visible description"},
    ratingAverage: 4.7,
    ratingCount: 3,
};

describe("structured data", () => {
    it("uses only visible product facts and safe serialization", () => {
        const schema = buildProductStructuredData(product, "https://shop.example.com/kz/product/7");
        expect(schema).toMatchObject({name: product.name, sku: product.sku, model: product.model});
        expect(schema.offers).toMatchObject({priceCurrency: "KZT", availability: "https://schema.org/InStock"});
        expect(schema.aggregateRating).toMatchObject({ratingValue: 4.7, reviewCount: 3});
        const serialized = serializeJsonLd(schema);
        expect(serialized).not.toContain("<");
        expect(JSON.parse(serialized).name).toBe(product.name);
    });

    it("omits invalid optional facts and maps unavailable stock", () => {
        const schema = buildProductStructuredData({...product, stockQuantity: 0, ratingCount: 0, description: null, images: []}, "https://shop.example.com/en/product/7");
        expect(schema.aggregateRating).toBeUndefined();
        expect(schema.description).toBeUndefined();
        expect(schema.image).toBeUndefined();
        expect(schema.offers?.availability).toBe("https://schema.org/OutOfStock");
    });

    it("builds an exact ordered breadcrumb list", () => {
        const schema = buildBreadcrumbStructuredData([
            {name: "Home", url: "https://shop.example.com/en"},
            {name: product.name, url: "https://shop.example.com/en/product/7"},
        ]);
        expect(schema.itemListElement.map((item) => item.position)).toEqual([1, 2]);
        expect(schema.itemListElement[1].name).toBe(product.name);
    });
});
