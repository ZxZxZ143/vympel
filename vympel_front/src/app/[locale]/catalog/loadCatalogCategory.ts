import {notFound} from "next/navigation";

import {PublicApiController} from "@/api/controllers/PublicController";
import {ApiError} from "@/api/types/ApiError";
import {ICategoryWithParent} from "@/api/types/CategoryTypes";
import {LocaleEnum} from "@/i18n/routing";

export async function loadCatalogCategory(
    categoryCode: string | undefined,
    locale: LocaleEnum
): Promise<ICategoryWithParent | null> {
    if (!categoryCode) {
        return null;
    }

    try {
        return await PublicApiController.getCategoryByCode(categoryCode, locale);
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
            notFound();
        }

        console.error(error);
        return null;
    }
}
