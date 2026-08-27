import { describe, expect, it } from "vitest";
import type { Product, References } from "@/shared/api/types";
import { emptyForm, productToForm, toPayload } from "./ProductForm";

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
});
