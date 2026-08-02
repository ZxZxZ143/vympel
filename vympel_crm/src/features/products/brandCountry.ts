import type { BrandFeature } from "@/shared/api/types";

export function brandCountryFor(
  brands: BrandFeature[],
  brandId: string | number | null | undefined
): BrandFeature | null {
  if (brandId === null || brandId === undefined || String(brandId).trim() === "") {
    return null;
  }

  return brands.find((brand) => String(brand.id) === String(brandId)) ?? null;
}
