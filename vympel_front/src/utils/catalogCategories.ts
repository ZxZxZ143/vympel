import type {ICmsBlock} from "@/api/types/CmsTypes";
import {PUBLIC_CATEGORY_CODES} from "@/config/routes";
import {findCmsBlock} from "@/utils/cmsContent";

const ACCESSORY_CATEGORY_CODES = new Set([
    PUBLIC_CATEGORY_CODES.accessories,
    "ACCESSORY",
    "APPLE_CASE",
]);

const INTERIOR_CATEGORY_CODES = new Set([
    PUBLIC_CATEGORY_CODES.interior,
    "WATCH_WALL",
    "WATCH_FLOOR",
]);

export function normalizeCatalogCategoryCode(categoryCode: string | null | undefined) {
    return categoryCode?.trim().replace(/-/g, "_").toUpperCase() ?? "";
}

export function isAccessoryCategoryCode(categoryCode: string | null | undefined) {
    return ACCESSORY_CATEGORY_CODES.has(normalizeCatalogCategoryCode(categoryCode));
}

export function isInteriorClockCategoryCode(categoryCode: string | null | undefined) {
    return INTERIOR_CATEGORY_CODES.has(normalizeCatalogCategoryCode(categoryCode));
}

export function catalogHeroFallback(categoryCode: string | null | undefined) {
    if (isAccessoryCategoryCode(categoryCode)) {
        return "/accessories_hero_banner.webp";
    }

    if (isInteriorClockCategoryCode(categoryCode)) {
        return "/interior_hero_banner.webp";
    }

    return "/catalog-hero-banner.webp";
}

export function findCatalogHeroBlock(blocks: ICmsBlock[] | undefined, categoryCode: string | null | undefined) {
    const normalizedCode = normalizeCatalogCategoryCode(categoryCode);
    const blockKeys = categoryHeroBlockKeys(normalizedCode);

    for (const blockKey of blockKeys) {
        const block = findCmsBlock(blocks, blockKey);

        if (block) {
            return block;
        }
    }

    if (!normalizedCode) {
        return findCmsBlock(blocks, "catalog.heroBanner");
    }

    if (isAccessoryCategoryCode(normalizedCode) || isInteriorClockCategoryCode(normalizedCode)) {
        return null;
    }

    return findCmsBlock(blocks, "catalog.heroBanner");
}

function categoryHeroBlockKeys(normalizedCode: string) {
    if (!normalizedCode) {
        return [];
    }

    const keys = [`catalog.category.${normalizedCode}.heroBanner`];

    if (ACCESSORY_CATEGORY_CODES.has(normalizedCode) && normalizedCode !== PUBLIC_CATEGORY_CODES.accessories) {
        keys.push(`catalog.category.${PUBLIC_CATEGORY_CODES.accessories}.heroBanner`);
    }

    if (INTERIOR_CATEGORY_CODES.has(normalizedCode) && normalizedCode !== PUBLIC_CATEGORY_CODES.interior) {
        keys.push(`catalog.category.${PUBLIC_CATEGORY_CODES.interior}.heroBanner`);
    }

    return keys;
}
