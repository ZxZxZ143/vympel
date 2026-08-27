import {describe, expect, it} from "vitest";
import type {IProductDetails} from "@/api/types/ProductTypes";
import {buildProductSpecRows} from "./index";

const labels = {
    bracelet: "Bracelet",
    case: "Case",
    country: "Country",
    mechanismType: "Mechanism",
    gender: "Gender",
    glass: "Glass",
    caseSize: "Case size",
    waterResistance: "Water resistance",
    stoneInsert: "Stone",
    millimeter: "mm",
    color: "Color",
    style: "Style",
    powerType: "Power",
    dimensions: "Dimensions",
    weight: "Weight",
    warrantyMonths: "Warranty",
    grams: "g",
    months: "months",
    claspType: "Clasp type",
    accessoryCaseMaterial: "Case material",
    insertMaterial: "Insert material",
    hasInsert: "Has insert",
    length: "Length",
    yes: "Yes",
    no: "No",
};

describe("accessory product specifications", () => {
    it("renders only the two accessory characteristics that have values", () => {
        const product = {
            productType: "ACCESSORY",
            brand: {id: "1", name: "Brand", country: ["Switzerland"]},
            accessoryDetails: {
                productId: 1,
                color: {id: "2", name: "Black"},
                length: "45 cm",
            },
        } as IProductDetails;

        expect(buildProductSpecRows(product, labels)).toEqual([
            {label: "Color", value: "Black"},
            {label: "Length", value: "45 cm"},
        ]);
    });

    it("does not render empty rows or a brand-country fallback when no accessory values exist", () => {
        const product = {
            productType: "ACCESSORY",
            brand: {id: "1", name: "Brand", country: ["Switzerland"]},
            accessoryDetails: {
                productId: 1,
                claspType: null,
                caseMaterial: null,
                insertMaterial: null,
                hasInsert: null,
                color: null,
                length: null,
            },
        } as IProductDetails;

        expect(buildProductSpecRows(product, labels)).toEqual([]);
    });

    it("keeps an explicit false boolean visible as No", () => {
        const product = {
            productType: "ACCESSORY",
            accessoryDetails: {productId: 1, hasInsert: false},
        } as IProductDetails;

        expect(buildProductSpecRows(product, labels)).toEqual([
            {label: "Has insert", value: "No"},
        ]);
    });
});
