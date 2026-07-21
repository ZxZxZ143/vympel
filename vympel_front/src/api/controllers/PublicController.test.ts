import {afterEach, describe, expect, it, vi} from "vitest";

import {PublicApiController} from "./PublicController";
import {LocaleEnum} from "@/i18n/routing";

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("PublicController product batch summary", () => {
    it("uses one bounded POST request for the whole collection and deduplicates ids", async () => {
        (PublicApiController as unknown as {baseApiUrl: string}).baseApiUrl = "https://example.test/api/public";
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
            items: [{id: 3, name: "Watch", price: 100}],
            missingIds: [2],
        }), {status: 200, headers: {"Content-Type": "application/json"}}));
        vi.stubGlobal("fetch", fetchMock);

        const result = await PublicApiController.getProductBatchSummary([3, 2, 3], LocaleEnum.RU);

        expect(fetchMock).toHaveBeenCalledOnce();
        expect(fetchMock.mock.calls[0]?.[0]).toBe("https://example.test/api/public/product/batch-summary/ru");
        expect(JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)).toEqual({ids: [3, 2]});
        expect(result.missingIds).toEqual([2]);
    });

    it("rejects an oversized batch before making a request", async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal("fetch", fetchMock);

        await expect(PublicApiController.getProductBatchSummary(
            Array.from({length: 61}, (_, index) => index + 1),
            LocaleEnum.EN
        )).rejects.toThrow("at most 60 ids");
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("shares simultaneous identical requests without caching stale results", async () => {
        (PublicApiController as unknown as {baseApiUrl: string}).baseApiUrl = "https://example.test/api/public";
        let resolveFetch!: (response: Response) => void;
        const fetchMock = vi.fn(() => new Promise<Response>((resolve) => { resolveFetch = resolve; }));
        vi.stubGlobal("fetch", fetchMock);

        const first = PublicApiController.getProductBatchSummary([1, 2], LocaleEnum.EN);
        const second = PublicApiController.getProductBatchSummary([1, 2], LocaleEnum.EN);
        resolveFetch(new Response(JSON.stringify({items: [], missingIds: []}), {status: 200}));
        await Promise.all([first, second]);

        expect(fetchMock).toHaveBeenCalledOnce();
    });
});
