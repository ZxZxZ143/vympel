import { ProductType, References } from "@/shared/api/types";

export type CategoryProfile = "wristwatch" | "interior" | "accessory" | "generic";

const wristwatchCodes = new Set([
  "WATCH_WRIST",
  "WATCH_MEN",
  "WATCH_WOMEN",
  "WATCH_UNISEX",
  "SMARTWATCH",
  "WATCH_CLASSIC",
  "WATCH_SPORT",
  "WATCH_DIVER",
  "WATCH_CHRONOGRAPH",
]);
const interiorCodes = new Set(["WATCH_INTERIOR", "WATCH_WALL", "WATCH_FLOOR"]);
const accessoryCodes = new Set(["ACCESSORIES", "ACCESSORY", "APPLE_CASE"]);

export function getCategoryProfile(categories: References["categories"], categoryId: string): CategoryProfile {
  if (!categoryId) {
    return "generic";
  }

  for (const code of categoryCodeChain(categories, categoryId)) {
    if (wristwatchCodes.has(code)) return "wristwatch";
    if (interiorCodes.has(code)) return "interior";
    if (accessoryCodes.has(code)) return "accessory";
  }

  return "generic";
}

export function productTypeForCategory(categories: References["categories"], categoryId: string): ProductType {
  const codes = categoryCodeChain(categories, categoryId);

  if (codes.includes("APPLE_CASE")) return "APPLE_CASE";
  if (codes.includes("WATCH_FLOOR")) return "FLOOR_CLOCK";
  if (codes.some((code) => interiorCodes.has(code))) return "WALL_CLOCK";
  if (codes.some((code) => accessoryCodes.has(code))) return "ACCESSORY";

  return "WATCH";
}

function categoryCodeChain(categories: References["categories"], categoryId: string): string[] {
  if (!categoryId) {
    return [];
  }

  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const codes: string[] = [];
  let current = categoryById.get(Number(categoryId));

  while (current) {
    codes.push(current.code.toUpperCase());
    current = current.parentId === null ? undefined : categoryById.get(current.parentId);
  }

  return codes;
}
