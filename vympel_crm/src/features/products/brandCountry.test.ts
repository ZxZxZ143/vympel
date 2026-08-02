import { describe, expect, it } from "vitest";
import { brandCountryFor } from "@/features/products/brandCountry";
import type { BrandFeature } from "@/shared/api/types";

const brands: BrandFeature[] = [
  { id: 1, name: "Royal London", code: "royal-london", countryId: 11, countryCode: "england", countryName: "England" },
  { id: 2, name: "Romanson", code: "romanson", countryId: 12, countryCode: "south-korea", countryName: "South Korea" },
  { id: 3, name: "Pierre Ricaud", code: "pierre-ricaud", countryId: 13, countryCode: "germany", countryName: "Germany" },
  { id: 4, name: "Appella", code: "appella", countryId: 14, countryCode: "switzerland", countryName: "Switzerland" },
  { id: 5, name: "Adriatica", code: "adriatica", countryId: 14, countryCode: "switzerland", countryName: "Switzerland" },
  {
    id: 6,
    name: "Rhythm",
    code: "rhythm",
    countryId: 15,
    countryCode: "japan",
    countryName: "Japan",
  },
];

describe("brandCountryFor", () => {
  it("returns every backend-provided canonical brand-country mapping", () => {
    expect(brands.map((brand) => brandCountryFor(brands, String(brand.id))?.countryName)).toEqual([
      "England",
      "South Korea",
      "Germany",
      "Switzerland",
      "Switzerland",
      "Japan",
    ]);
  });

  it("does not invent a country for an unknown brand", () => {
    expect(brandCountryFor(brands, "999")).toBeNull();
  });
});
