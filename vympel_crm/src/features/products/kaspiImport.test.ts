import { describe, expect, it } from "vitest";

import type { KaspiImportPreview } from "@/shared/api/types";
import { emptyForm } from "./ProductForm";
import { applyKaspiImportPreview } from "./kaspiImport";

function preview(overrides: Partial<KaspiImportPreview["values"]> = {}): KaspiImportPreview {
  return {
    source: "KASPI",
    sourceUrl: "https://kaspi.kz/shop/p/test-1",
    categoryId: 1,
    categoryProfile: "WRISTWATCH",
    values: {
      kaspiUrl: "https://kaspi.kz/shop/p/test-1",
      ...overrides,
    },
    mappedFields: [],
    mappedCharacteristics: [],
    unmappedCharacteristics: [],
    unresolvedCharacteristics: [],
    warnings: [],
  };
}

describe("applyKaspiImportPreview", () => {
  it("replaces only present values and preserves manual, unresolved, and category-owned state", () => {
    const current = {
      ...emptyForm,
      categoryId: "1",
      productType: "WATCH" as const,
      nameRu: "Manual name",
      descriptionRu: "Manual description",
      price: "500",
      caseMaterialId: "7",
    };
    const imported = preview({ nameRu: "Imported name", price: null, descriptionRu: undefined });

    const result = applyKaspiImportPreview(current, imported);

    expect(result).toMatchObject({
      categoryId: "1",
      productType: "WATCH",
      nameRu: "Imported name",
      descriptionRu: "Manual description",
      price: "500",
      caseMaterialId: "7",
    });
  });

  it("preserves meaningful false and zero while ignoring null optional values", () => {
    const current = {
      ...emptyForm,
      categoryId: "1",
      productType: "ACCESSORY" as const,
      price: "900",
      accessoryHasInsert: "true",
      accessoryColorId: "8",
    };
    const imported: KaspiImportPreview = {
      ...preview({ price: 0 }),
      categoryProfile: "ACCESSORY",
      values: {
        price: 0,
        kaspiUrl: "https://kaspi.kz/shop/p/test-1",
        accessoryDetails: { hasInsert: false, colorId: null },
      },
    };

    const result = applyKaspiImportPreview(current, imported);

    expect(result.price).toBe("0");
    expect(result.accessoryHasInsert).toBe("false");
    expect(result.accessoryColorId).toBe("8");
  });

  it("is idempotent and supports a later import replacing an earlier applied product", () => {
    const current = { ...emptyForm, categoryId: "1", productType: "WATCH" as const };
    const productA = preview({ nameRu: "A", model: "A-1", price: 100 });
    const appliedA = applyKaspiImportPreview(current, productA);

    expect(applyKaspiImportPreview(appliedA, productA)).toEqual(appliedA);

    const productB = {
      ...preview({ nameRu: "B", model: "B-2", price: 200 }),
      sourceUrl: "https://kaspi.kz/shop/p/test-2",
      values: {
        nameRu: "B",
        model: "B-2",
        price: 200,
        kaspiUrl: "https://kaspi.kz/shop/p/test-2",
      },
    };
    expect(applyKaspiImportPreview(appliedA, productB)).toMatchObject({
      nameRu: "B",
      model: "B-2",
      price: "200",
      kaspiUrl: "https://kaspi.kz/shop/p/test-2",
    });
  });

  it("trims an imported model before normal product creation can derive grouping", () => {
    const current = { ...emptyForm, categoryId: "1", productType: "WATCH" as const };

    const result = applyKaspiImportPreview(current, preview({ model: "  TL4247HM  " }));

    expect(result.model).toBe("TL4247HM");
  });

  it("refuses a preview for a different selected category", () => {
    const current = { ...emptyForm, categoryId: "1", nameRu: "Keep" };
    const mismatched = { ...preview({ nameRu: "Wrong" }), categoryId: 2 };

    expect(applyKaspiImportPreview(current, mismatched)).toBe(current);
  });
});
