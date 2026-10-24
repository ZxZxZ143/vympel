import {afterEach, describe, expect, it, vi} from "vitest";

import {PublicApiController} from "./PublicController";
import {LocaleEnum} from "@/i18n/routing";

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe("PublicController product batch summary", () => {
    it("bounds server-side API waits with an abort timeout", async () => {
        (PublicApiController as unknown as {baseApiUrl: string}).baseApiUrl = "https://example.test/api/public";
        const aborted = AbortSignal.abort(new DOMException("Timed out", "TimeoutError"));
        const timeout = vi.spyOn(AbortSignal, "timeout").mockReturnValue(aborted);
        const fetchMock = vi.fn((_input: string | URL | Request, init?: RequestInit) => {
            return Promise.reject(init?.signal?.reason ?? new Error("missing signal"));
        });
        vi.stubGlobal("fetch", fetchMock);

        await expect(PublicApiController.getProduct(42, LocaleEnum.RU)).rejects.toMatchObject({
            name: "TimeoutError",
        });

        expect(timeout).toHaveBeenCalledWith(8_000);
        expect(fetchMock.mock.calls[0]?.[1]?.signal).toBe(aborted);
    });

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

import {catalogRequestParams} from "@/lib/catalogQuery";

describe("catalog sort serialization", () => {
    it("passes current facet selections and search without pagination or sort controls", async () => {
        (PublicApiController as unknown as {baseApiUrl: string}).baseApiUrl = "https://example.test/api/public";
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({filters: []}), {status: 200}));
        vi.stubGlobal("fetch", fetchMock);
        const controller = new AbortController();
        await PublicApiController.getCatalogFilters(LocaleEnum.RU, "WATCH_WRIST",
            new URLSearchParams("mechanism=2&mechanism=3&caseMaterial=4&search=clock&priceMin=100&page=9&size=9&sort=priceAsc"), controller.signal);
        const url = new URL(fetchMock.mock.calls[0][0]);
        expect(url.searchParams.getAll("mechanism")).toEqual(["2", "3"]);
        expect(url.searchParams.get("caseMaterial")).toBe("4");
        expect(url.searchParams.get("categoryCode")).toBe("WATCH_WRIST");
        expect(url.searchParams.get("search")).toBe("clock");
        expect(url.searchParams.get("priceMin")).toBe("100");
        for (const key of ["page", "size", "sort"]) expect(url.searchParams.has(key)).toBe(false);
        expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
    });
    it.each(["search=romanson", "search=romanson&sort=priceAsc", "search=romanson&sort=newest", ""]) ("serializes %s consistently", async (query) => {
        (PublicApiController as unknown as {baseApiUrl: string}).baseApiUrl = "https://example.test/api/public";
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({content: [], totalElements: 0}), {status: 200}));
        vi.stubGlobal("fetch", fetchMock);
        const params = catalogRequestParams(LocaleEnum.RU, undefined, new URLSearchParams(query));
        await PublicApiController.getCatalogProducts(params);
        const url = new URL(fetchMock.mock.calls[0][0]);
        expect(url.searchParams.get("sort")).toBe(params.sort ?? null);
        expect(url.searchParams.get("size")).toBe("9");
        expect(url.toString()).not.toContain("undefined");
    });
});
