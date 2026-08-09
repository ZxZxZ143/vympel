import {describe, expect, it, vi} from "vitest";

import {ApiError} from "@/api/types/ApiError";
import {LocaleEnum} from "@/i18n/routing";
import type {IProductDetails} from "@/api/types/ProductTypes";
import {resolveProductPageData} from "./productPageData";

const product = {id: 1, name: "Test", images: []} as unknown as IProductDetails;

describe("product page data classification", () => {
    it("returns the shared successful product", async () => {
        const fetcher = vi.fn().mockResolvedValue(product);
        await expect(resolveProductPageData(fetcher, "1", LocaleEnum.EN)).resolves.toEqual({status: "success", product});
        expect(fetcher).toHaveBeenCalledOnce();
    });

    it("separates confirmed 404 from transient failures", async () => {
        const notFound = new ApiError(404, "Missing", {code: "RESOURCE_NOT_FOUND"});
        await expect(resolveProductPageData(vi.fn().mockRejectedValue(notFound), "999", LocaleEnum.RU))
            .resolves.toEqual({status: "not_found"});
        const failure = new Error("upstream unavailable");
        await expect(resolveProductPageData(vi.fn().mockRejectedValue(failure), "1", LocaleEnum.KZ))
            .resolves.toEqual({status: "transient_error", error: failure});
        await expect(resolveProductPageData(vi.fn().mockResolvedValue(null), "1", LocaleEnum.KZ))
            .resolves.toEqual({status: "transient_error"});
    });
});
