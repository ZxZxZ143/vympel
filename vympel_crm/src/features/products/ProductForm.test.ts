import { describe, expect, it } from "vitest";
import type { KaspiImportPreview, Product, References } from "@/shared/api/types";
import { emptyForm, productToForm, toPayload, withSelectedCategory } from "./ProductForm";
import { applyKaspiImportPreview } from "./kaspiImport";

const references: References = {
  categories: [{ id: 1, code: "WATCH_WRIST", name: "Watches", parentId: null }],
  brands: [],
  collections: [],
  mechanisms: [],
  genders: [],
  materials: [],
  glassTypes: [],
  stoneInlays: [],
  countries: [],
  interiorColors: [],
  interiorStyles: [],
  interiorMechanisms: [],
  interiorPowerTypes: [],
};

const accessoryReferences: References = {
  ...references,
  categories: [{ id: 10, code: "ACCESSORIES", name: "Accessories", parentId: null }],
  materials: [
    { id: 20, name: "Steel" },
    { id: 21, name: "Ceramic" },
  ],
  interiorColors: [{ id: 30, name: "Black" }],
};

const interiorReferences: References = {
  ...references,
  categories: [{ id: 40, code: "WATCH_INTERIOR", name: "Interior clocks", parentId: null }],
};

describe("product replacement payload", () => {
  it("sends explicit nulls when the last wristwatch detail is cleared", () => {
    const payload = toPayload(
      {
        ...emptyForm,
        categoryId: "1",
        brandId: "2",
        waterResistance: "",
      },
      references,
    );

    expect(payload.watchDetails).toEqual({
      mechanismId: null,
      genderId: null,
      caseMaterialId: null,
      strapMaterialId: null,
      glassTypeId: null,
      caseSizeMm: null,
      waterResistance: null,
      stoneInlayId: null,
    });
  });

  it("preserves multilingual Markdown through save and edit-form reload", () => {
    const ru = "## ROMANSON\n\n**Жирный** и <u>подчёркнутый</u>";
    const en = "### Features\n\n- **Case:** steel\n- *Style:* classic";
    const kz = "> Дәйексөз\n\n[Сілтеме](https://example.com)";
    const payload = toPayload(
      {
        ...emptyForm,
        categoryId: "1",
        brandId: "2",
        descriptionRu: ru,
        descriptionEn: en,
        descriptionKz: kz,
      },
      references,
    );

    expect(payload.description).toEqual({
      desc: ru,
      desc_ru: ru,
      desc_en: en,
      desc_kz: kz,
    });

    const reopened = productToForm({
      description: { content: ru },
      descriptionTranslations: payload.description,
    } as Product);

    expect(reopened.descriptionRu).toBe(ru);
    expect(reopened.descriptionEn).toBe(en);
    expect(reopened.descriptionKz).toBe(kz);
  });

  it.each([
    {
      name: "none",
      fields: {},
      expected: {
        claspType: null,
        caseMaterialId: null,
        insertMaterialId: null,
        hasInsert: null,
        colorId: null,
        length: null,
      },
    },
    {
      name: "only color",
      fields: { accessoryColorId: "30" },
      expected: {
        claspType: null,
        caseMaterialId: null,
        insertMaterialId: null,
        hasInsert: null,
        colorId: 30,
        length: null,
      },
    },
    {
      name: "color and length",
      fields: { accessoryColorId: "30", accessoryLength: "45 cm" },
      expected: {
        claspType: null,
        caseMaterialId: null,
        insertMaterialId: null,
        hasInsert: null,
        colorId: 30,
        length: "45 cm",
      },
    },
    {
      name: "has insert no",
      fields: { accessoryHasInsert: "false" },
      expected: {
        claspType: null,
        caseMaterialId: null,
        insertMaterialId: null,
        hasInsert: false,
        colorId: null,
        length: null,
      },
    },
    {
      name: "has insert yes without material",
      fields: { accessoryHasInsert: "true" },
      expected: {
        claspType: null,
        caseMaterialId: null,
        insertMaterialId: null,
        hasInsert: true,
        colorId: null,
        length: null,
      },
    },
    {
      name: "all characteristics",
      fields: {
        accessoryClaspType: "Lobster clasp",
        accessoryCaseMaterialId: "20",
        accessoryInsertMaterialId: "21",
        accessoryHasInsert: "true",
        accessoryColorId: "30",
        accessoryLength: "45 cm",
      },
      expected: {
        claspType: "Lobster clasp",
        caseMaterialId: 20,
        insertMaterialId: 21,
        hasInsert: true,
        colorId: 30,
        length: "45 cm",
      },
    },
  ])("supports an accessory with $name", ({ fields, expected }) => {
    const payload = toPayload(
      {
        ...emptyForm,
        categoryId: "10",
        brandId: "2",
        ...fields,
      },
      accessoryReferences,
    );

    expect(payload.accessoryDetails).toEqual(expected);
  });

  it("reloads saved accessory values and sends explicit nulls after they are removed", () => {
    const reopened = productToForm({
      accessoryDetails: {
        productId: 1,
        claspType: "Lobster clasp",
        caseMaterial: { id: 20, name: "Steel" },
        insertMaterial: { id: 21, name: "Ceramic" },
        hasInsert: false,
        color: { id: 30, name: "Black" },
        length: "45 cm",
      },
    } as Product);

    expect(reopened.accessoryHasInsert).toBe("false");
    expect(reopened.accessoryColorId).toBe("30");
    expect(reopened.accessoryLength).toBe("45 cm");

    const cleared = toPayload(
      {
        ...reopened,
        categoryId: "10",
        brandId: "2",
        accessoryClaspType: "",
        accessoryCaseMaterialId: "",
        accessoryInsertMaterialId: "",
        accessoryHasInsert: "",
        accessoryColorId: "",
        accessoryLength: "",
      },
      accessoryReferences,
    );

    expect(cleared.accessoryDetails).toEqual({
      claspType: null,
      caseMaterialId: null,
      insertMaterialId: null,
      hasInsert: null,
      colorId: null,
      length: null,
    });
  });

  it("keeps every interior-clock characteristic optional, including production country", () => {
    const payload = toPayload(
      {
        ...emptyForm,
        categoryId: "40",
        brandId: "2",
      },
      interiorReferences,
    );

    expect(payload.interiorClockDetails).toEqual({
      productionCountryId: null,
      caseMaterialId: null,
      colorId: null,
      styleId: null,
      mechanismTypeId: null,
      powerTypeId: null,
      dimensions: null,
      weightGrams: null,
      warrantyMonths: null,
    });
  });

  it("clears stale category-specific values when switching between watches and accessories", () => {
    const categories = [
      { id: 1, code: "WATCH_WRIST", name: "Watches", parentId: null },
      { id: 10, code: "ACCESSORIES", name: "Accessories", parentId: null },
    ];
    const accessory = withSelectedCategory({
      ...emptyForm,
      categoryId: "1",
      mechanismId: "5",
      waterResistance: "5 ATM",
    }, categories, "10");

    expect(accessory.mechanismId).toBe("");
    expect(accessory.waterResistance).toBe("");
    expect(accessory.categoryId).toBe("10");
    expect(accessory.productType).toBe("ACCESSORY");

    const watch = withSelectedCategory({
      ...accessory,
      accessoryColorId: "30",
      accessoryHasInsert: "false",
      accessoryLength: "45 cm",
    }, categories, "1");

    expect(watch.accessoryColorId).toBe("");
    expect(watch.accessoryHasInsert).toBe("");
    expect(watch.accessoryLength).toBe("");
    expect(watch.categoryId).toBe("1");
    expect(watch.productType).toBe("WATCH");
  });
});

describe("Kaspi import preview application", () => {
  it("applies only present mapped fields while preserving category, product type, and absent values", () => {
    const current = {
      ...emptyForm,
      categoryId: "1",
      productType: "WATCH" as const,
      nameRu: "Current name",
      nameEn: "English stays",
      price: "500",
      stockQuantity: "9",
      brandId: "10",
      collectionId: "33",
      caseMaterialId: "1",
      accessoryHasInsert: "true",
    };
    const preview = kaspiPreview({
      nameRu: "Imported name",
      brandId: 10,
      price: 0,
      descriptionRu: "Описание **Markdown**",
      kaspiUrl: "https://kaspi.kz/shop/p/watch-123",
      watchDetails: {
        mechanismId: 5,
        genderId: null,
        caseMaterialId: null,
        strapMaterialId: 3,
        glassTypeId: 4,
        caseSizeMm: 0,
        waterResistance: "5 ATM",
        stoneInlayId: null,
      },
    });

    const applied = applyKaspiImportPreview(current, preview);

    expect(applied).toMatchObject({
      categoryId: "1",
      productType: "WATCH",
      nameRu: "Imported name",
      nameEn: "English stays",
      price: "0",
      stockQuantity: "9",
      collectionId: "33",
      caseMaterialId: "1",
      mechanismId: "5",
      strapMaterialId: "3",
      glassTypeId: "4",
      caseSizeMm: "0",
      waterResistance: "5 ATM",
      descriptionRu: "Описание **Markdown**",
      kaspiUrl: "https://kaspi.kz/shop/p/watch-123",
    });
  });

  it("clears brand-dependent values on a changed imported brand and preserves false", () => {
    const applied = applyKaspiImportPreview({
      ...emptyForm,
      categoryId: "10",
      productType: "ACCESSORY",
      brandId: "10",
      collectionId: "33",
      productionCountryId: "20",
    }, {
      ...kaspiPreview({
        brandId: 11,
        kaspiUrl: "https://kaspi.kz/shop/p/accessory-123",
        accessoryDetails: {
          claspType: null,
          caseMaterialId: null,
          insertMaterialId: null,
          hasInsert: false,
          colorId: null,
          length: null,
        },
      }),
      categoryId: 10,
      categoryProfile: "ACCESSORY",
    });

    expect(applied.brandId).toBe("11");
    expect(applied.collectionId).toBe("");
    expect(applied.productionCountryId).toBe("");
    expect(applied.accessoryHasInsert).toBe("false");
  });

  it("refuses a stale preview produced for another selected category", () => {
    const current = { ...emptyForm, categoryId: "1", nameRu: "Keep me" };
    const preview = { ...kaspiPreview({ nameRu: "Wrong category", kaspiUrl: "https://kaspi.kz/shop/p/x" }), categoryId: 2 };

    expect(applyKaspiImportPreview(current, preview)).toBe(current);
  });
});

function kaspiPreview(values: KaspiImportPreview["values"]): KaspiImportPreview {
  return {
    source: "KASPI",
    sourceUrl: values.kaspiUrl,
    categoryId: 1,
    categoryProfile: "WRISTWATCH",
    values,
    mappedFields: [],
    mappedCharacteristics: [],
    unmappedCharacteristics: [],
    unresolvedCharacteristics: [],
    warnings: [],
  };
}
