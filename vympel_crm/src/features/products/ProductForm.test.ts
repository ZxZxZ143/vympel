import { describe, expect, it } from "vitest";
import type { References } from "@/shared/api/types";
import { emptyForm, toPayload } from "./ProductForm";

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
});
