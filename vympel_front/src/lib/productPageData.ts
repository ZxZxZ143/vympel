import {cache} from "react";

import {PublicApiController} from "@/api/controllers/PublicController";
import {ApiError} from "@/api/types/ApiError";
import type {IProductDetails} from "@/api/types/ProductTypes";
import {LocaleEnum} from "@/i18n/routing";

export type ProductPageData =
    | {status: "success"; product: IProductDetails}
    | {status: "not_found"}
    | {status: "transient_error"; error?: unknown};

type ProductFetcher = (id: string, locale: LocaleEnum) => Promise<IProductDetails | null>;

export async function resolveProductPageData(
    fetchProduct: ProductFetcher,
    id: string,
    locale: LocaleEnum,
): Promise<ProductPageData> {
    try {
        const product = await fetchProduct(id, locale);
        return product ? {status: "success", product} : {status: "transient_error"};
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) return {status: "not_found"};
        return {status: "transient_error", error};
    }
}

export const loadProductPageData = cache((id: string, locale: LocaleEnum) => (
    resolveProductPageData(
        (productId, productLocale) => PublicApiController.getProduct(productId, productLocale),
        id,
        locale,
    )
));
