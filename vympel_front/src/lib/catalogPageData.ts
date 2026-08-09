import type {Page} from "@/api/types/PageType";
import {PublicApiController} from "@/api/controllers/PublicController";
import type {IProduct} from "@/api/types/ProductTypes";
import type {IProductListParams} from "@/api/types/ProductTypes";

export type CatalogPageData =
    | {status: "success"; page: Page<IProduct>}
    | {status: "out_of_range"}
    | {status: "transient_error"; error: unknown};

export async function loadCatalogPageData(request: IProductListParams): Promise<CatalogPageData> {
    try {
        const page = await PublicApiController.getCatalogProducts(request);
        const requestedPage = (request.page ?? 0) + 1;
        if (
            requestedPage > 1
            && (page.totalPages === 0 || requestedPage > page.totalPages)
        ) {
            return {status: "out_of_range"};
        }
        return {status: "success", page};
    } catch (error) {
        return {status: "transient_error", error};
    }
}
