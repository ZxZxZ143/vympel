import type { BrandCreatePayload, BrandFeature, Feature } from "@/shared/api/types";

/** Country select sentinel meaning "create a new country together with the brand". */
export const NEW_COUNTRY_OPTION = "__new__";

export type BrandFormState = {
  name: string;
  countryId: string;
  countryIso2: string;
  countryNameRu: string;
  countryNameEn: string;
  countryNameKz: string;
};

export const emptyBrandForm: BrandFormState = {
  name: "",
  countryId: "",
  countryIso2: "",
  countryNameRu: "",
  countryNameEn: "",
  countryNameKz: "",
};

const iso2Pattern = /^[A-Za-z]{2}$/;

export function validateBrandForm(form: BrandFormState, t: (key: string) => string): string | null {
  if (!form.name.trim() || !form.countryId) {
    return t("products.brandRequiredError");
  }

  if (form.countryId !== NEW_COUNTRY_OPTION) {
    return null;
  }

  const names = [form.countryNameRu, form.countryNameEn, form.countryNameKz];
  if (!iso2Pattern.test(form.countryIso2.trim()) || names.some((value) => !value.trim())) {
    return t("products.countryRequiredError");
  }

  return null;
}

export function toBrandPayload(form: BrandFormState): BrandCreatePayload {
  if (form.countryId === NEW_COUNTRY_OPTION) {
    return {
      name: form.name.trim(),
      countryId: null,
      newCountry: {
        iso2: form.countryIso2.trim().toUpperCase(),
        nameRu: form.countryNameRu.trim(),
        nameEn: form.countryNameEn.trim(),
        nameKz: form.countryNameKz.trim(),
      },
    };
  }

  return { name: form.name.trim(), countryId: Number(form.countryId), newCountry: null };
}

const byName = (left: Feature, right: Feature) => left.name.localeCompare(right.name);

export function mergeBrandOption(brands: BrandFeature[], brand: BrandFeature): BrandFeature[] {
  return [...brands.filter((current) => current.id !== brand.id), brand].sort(byName);
}

export function mergeBrandCountryOption(countries: Feature[], brand: BrandFeature): Feature[] {
  if (countries.some((country) => country.id === brand.countryId)) {
    return countries;
  }

  return [...countries, { id: brand.countryId, name: brand.countryName, code: brand.countryCode }].sort(byName);
}

export function brandCreateErrorMessages(t: (key: string) => string): Readonly<Record<string, string>> {
  return {
    BRAND_EXISTS: t("products.brandExists"),
    COUNTRY_EXISTS: t("products.countryExists"),
    BRAND_NAME_INVALID: t("products.brandNameInvalid"),
    COUNTRY_NAME_INVALID: t("products.countryNameInvalid"),
  };
}
