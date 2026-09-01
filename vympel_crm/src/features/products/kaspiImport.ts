import type { KaspiImportPreview } from "@/shared/api/types";
import type { ProductFormState } from "./ProductForm";

export function applyKaspiImportPreview(
  current: ProductFormState,
  preview: KaspiImportPreview,
): ProductFormState {
  if (String(preview.categoryId) !== current.categoryId) {
    return current;
  }

  const next = { ...current };
  const values = preview.values;

  assignString(next, "nameRu", values.nameRu);
  assignString(next, "model", values.model);
  assignNumber(next, "price", values.price);
  assignString(next, "descriptionRu", values.descriptionRu);
  assignString(next, "kaspiUrl", values.kaspiUrl);

  if (values.brandId !== null && values.brandId !== undefined) {
    const importedBrandId = String(values.brandId);
    if (importedBrandId !== current.brandId) {
      next.collectionId = "";
      next.productionCountryId = "";
    }
    next.brandId = importedBrandId;
  }

  if (preview.categoryProfile === "WRISTWATCH" && values.watchDetails) {
    assignNumber(next, "mechanismId", values.watchDetails.mechanismId);
    assignNumber(next, "genderId", values.watchDetails.genderId);
    assignNumber(next, "caseMaterialId", values.watchDetails.caseMaterialId);
    assignNumber(next, "strapMaterialId", values.watchDetails.strapMaterialId);
    assignNumber(next, "glassTypeId", values.watchDetails.glassTypeId);
    assignNumber(next, "caseSizeMm", values.watchDetails.caseSizeMm);
    assignString(next, "waterResistance", values.watchDetails.waterResistance);
    assignNumber(next, "stoneInlayId", values.watchDetails.stoneInlayId);
  }

  if (preview.categoryProfile === "INTERIOR_CLOCK" && values.interiorClockDetails) {
    assignNumber(next, "productionCountryId", values.interiorClockDetails.productionCountryId);
    assignNumber(next, "interiorCaseMaterialId", values.interiorClockDetails.caseMaterialId);
    assignNumber(next, "interiorColorId", values.interiorClockDetails.colorId);
    assignNumber(next, "interiorStyleId", values.interiorClockDetails.styleId);
    assignNumber(next, "interiorMechanismTypeId", values.interiorClockDetails.mechanismTypeId);
    assignNumber(next, "powerTypeId", values.interiorClockDetails.powerTypeId);
    assignString(next, "dimensions", values.interiorClockDetails.dimensions);
    assignNumber(next, "weightGrams", values.interiorClockDetails.weightGrams);
    assignNumber(next, "warrantyMonths", values.interiorClockDetails.warrantyMonths);
  }

  if (preview.categoryProfile === "ACCESSORY" && values.accessoryDetails) {
    assignString(next, "accessoryClaspType", values.accessoryDetails.claspType);
    assignNumber(next, "accessoryCaseMaterialId", values.accessoryDetails.caseMaterialId);
    assignNumber(next, "accessoryInsertMaterialId", values.accessoryDetails.insertMaterialId);
    assignBoolean(next, "accessoryHasInsert", values.accessoryDetails.hasInsert);
    assignNumber(next, "accessoryColorId", values.accessoryDetails.colorId);
    assignString(next, "accessoryLength", values.accessoryDetails.length);
  }

  // Category selection owns these fields and import is never allowed to replace them.
  next.categoryId = current.categoryId;
  next.productType = current.productType;
  return next;
}

function assignString<Field extends keyof ProductFormState>(
  target: ProductFormState,
  field: Field,
  value: string | null | undefined,
) {
  if (value !== null && value !== undefined) {
    target[field] = value as ProductFormState[Field];
  }
}

function assignNumber<Field extends keyof ProductFormState>(
  target: ProductFormState,
  field: Field,
  value: number | null | undefined,
) {
  if (value !== null && value !== undefined) {
    target[field] = String(value) as ProductFormState[Field];
  }
}

function assignBoolean<Field extends keyof ProductFormState>(
  target: ProductFormState,
  field: Field,
  value: boolean | null | undefined,
) {
  if (value !== null && value !== undefined) {
    target[field] = String(value) as ProductFormState[Field];
  }
}
