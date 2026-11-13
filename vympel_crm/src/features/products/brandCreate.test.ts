import { describe, expect, it } from "vitest";
import type { BrandFeature } from "@/shared/api/types";
import {
  emptyBrandForm,
  mergeBrandCountryOption,
  mergeBrandOption,
  NEW_COUNTRY_OPTION,
  toBrandPayload,
  validateBrandForm,
} from "@/features/products/brandCreate";

const t = (key: string) => key;

const orient: BrandFeature = {
  id: 7,
  name: "Orient",
  code: "orient",
  countryId: 9,
  countryCode: "china",
  countryName: "Китай",
};

describe("brand creation helpers", () => {
  it("requires a brand name and a country choice", () => {
    expect(validateBrandForm(emptyBrandForm, t)).toBe("products.brandRequiredError");
    expect(validateBrandForm({ ...emptyBrandForm, name: "Orient" }, t)).toBe("products.brandRequiredError");
    expect(validateBrandForm({ ...emptyBrandForm, name: "  ", countryId: "3" }, t)).toBe("products.brandRequiredError");
    expect(validateBrandForm({ ...emptyBrandForm, name: "Orient", countryId: "3" }, t)).toBeNull();
  });

  it("requires a two-letter ISO code and all three names for a new country", () => {
    const base = { ...emptyBrandForm, name: "Orient", countryId: NEW_COUNTRY_OPTION };
    const filled = { ...base, countryIso2: "cn", countryNameRu: "Китай", countryNameEn: "China", countryNameKz: "Қытай" };

    expect(validateBrandForm(base, t)).toBe("products.countryRequiredError");
    expect(validateBrandForm({ ...filled, countryIso2: "C1" }, t)).toBe("products.countryRequiredError");
    expect(validateBrandForm({ ...filled, countryIso2: "CHN" }, t)).toBe("products.countryRequiredError");
    expect(validateBrandForm({ ...filled, countryNameKz: " " }, t)).toBe("products.countryRequiredError");
    expect(validateBrandForm(filled, t)).toBeNull();
  });

  it("sends either an existing country id or a new country, never both", () => {
    expect(toBrandPayload({ ...emptyBrandForm, name: " Orient ", countryId: "3" })).toEqual({
      name: "Orient",
      countryId: 3,
      newCountry: null,
    });

    expect(toBrandPayload({
      ...emptyBrandForm,
      name: "Orient",
      countryId: NEW_COUNTRY_OPTION,
      countryIso2: " cn ",
      countryNameRu: " Китай ",
      countryNameEn: "China",
      countryNameKz: "Қытай",
    })).toEqual({
      name: "Orient",
      countryId: null,
      newCountry: { iso2: "CN", nameRu: "Китай", nameEn: "China", nameKz: "Қытай" },
    });
  });

  it("merges the created brand and only an unknown country into the reference cache", () => {
    const brands: BrandFeature[] = [
      { id: 1, name: "Romanson", code: "romanson", countryId: 2, countryCode: "south-korea", countryName: "Южная Корея" },
    ];

    expect(mergeBrandOption(brands, orient).map((brand) => brand.name)).toEqual(["Orient", "Romanson"]);
    expect(mergeBrandOption([...brands, orient], orient)).toHaveLength(2);

    const countries = [{ id: 2, name: "Южная Корея", code: "south-korea" }];
    expect(mergeBrandCountryOption(countries, orient)).toEqual([
      { id: 9, name: "Китай", code: "china" },
      { id: 2, name: "Южная Корея", code: "south-korea" },
    ]);
    expect(mergeBrandCountryOption(countries, { ...orient, countryId: 2 })).toBe(countries);
  });
});
