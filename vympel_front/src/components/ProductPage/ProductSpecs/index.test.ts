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
    dialType: "Dial type",
    dialMarking: "Dial markings",
    powerSource: "Power source",
    strapColor: "Strap color",
    dialColor: "Dial color",
    packageContents: "Package contents",
    watchFeatures: "Watch features",
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

describe("wristwatch product specifications", () => {
    it("renders populated normalized watch characteristics and clean multi-value features", () => {
        const product = {
            productType: "WATCH",
            watchDetails: {
                productId: 1,
                waterResistance: "legacy value",
                waterResistanceOption: {id: "10", name: "WR50 (5 ATM)"},
                dialType: {id: "11", name: "Analog (hands)"},
                dialMarking: {id: "12", name: "Markers"},
                powerSource: {id: "13", name: "Battery"},
                strapColor: {id: "14", name: "White"},
                dialColor: {id: "15", name: "Brown"},
                packageContents: "Watch and box",
                features: [
                    {id: "16", name: "Date display"},
                    {id: "17", name: "Backlight"},
                ],
            },
        } as unknown as IProductDetails;

        expect(buildProductSpecRows(product, labels)).toEqual([
            {label: "Water resistance", value: "WR50 (5 ATM)"},
            {label: "Dial type", value: "Analog (hands)"},
            {label: "Dial markings", value: "Markers"},
            {label: "Power source", value: "Battery"},
            {label: "Strap color", value: "White"},
            {label: "Dial color", value: "Brown"},
            {label: "Package contents", value: "Watch and box"},
            {label: "Watch features", value: "Date display, Backlight"},
        ]);
    });

    it("omits every empty new watch characteristic", () => {
        const product = {
            productType: "WATCH",
            watchDetails: {
                productId: 1,
                dialType: null,
                dialMarking: null,
                powerSource: null,
                waterResistanceOption: null,
                strapColor: null,
                dialColor: null,
                packageContents: "   ",
                features: [],
            },
        } as unknown as IProductDetails;

        expect(buildProductSpecRows(product, labels)).toEqual([]);
    });
});
