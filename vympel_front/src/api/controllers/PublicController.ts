import {
    ICatalogFiltersResponse,
    IProduct,
    IProductDetails,
    IProductRecommendation,
    IProductListParams,
    IProductReview,
    IProductReviewListParams,
    IProductReviewPayload,
    IProductReviewSubmission,
    ICustomerRequestPayload,
    ICustomerRequestSubmission,
    IQuickSearchProduct,
    IProductBatchSummaryResponse
} from "@/api/types/ProductTypes";
import {PublicEndpoints} from "@/api/endpoints/PublicEndpoint";
import {parseError} from "@/api/ErrorParser";
import {createEmptyPage, normalizePageResponse, Page} from "@/api/types/PageType";
import {LocaleEnum} from "@/i18n/routing";
import {ICategory, ICategoryWithParent} from "@/api/types/CategoryTypes";
import {normalizeCatalogQueryValue, normalizeCatalogQueryValues} from "@/utils/catalogFilterParams";
import {ICmsPage} from "@/api/types/CmsTypes";

export type ProductAnalyticsEventType =
    | "VIEW"
    | "FAVORITE"
    | "UNFAVORITE"
    | "ADD_TO_CART"
    | "REMOVE_FROM_CART"
    | "MARKETPLACE_CLICK";

const inFlightProductBatchSummaries = new Map<string, Promise<IProductBatchSummaryResponse>>();

class PublicController {
    private baseApiUrl: string | undefined = process.env.BASE_API_PUBLIC ?? process.env.NEXT_PUBLIC_BASE_API_PUBLIC

    private getBaseUrl(): string {
        return this.baseApiUrl
            ? this.baseApiUrl
            : ""
    }

    public async getProduct(productId: number | string, lang: LocaleEnum): Promise<IProductDetails | null> {
        const base = this.getBaseUrl()

        if (!base) {
            return null;
        }

        const path = PublicEndpoints.product(lang, productId)
        const url = new URL(base + path)

        const res = await fetch(url.toString(), {
            method: "GET",
            cache: "no-cache",
        })

        if (!res.ok) {
            throw await parseError(res)
        }

        return res.json()
    }

    public async getProductBatchSummary(
        ids: number[],
        lang: LocaleEnum
    ): Promise<IProductBatchSummaryResponse> {
        const normalizedIds = Array.from(new Set(ids.filter((id) => Number.isInteger(id) && id > 0)));
        if (normalizedIds.length === 0) {
            return {items: [], missingIds: []};
        }
        if (normalizedIds.length > 60) {
            throw new Error("A product summary batch may contain at most 60 ids");
        }

        const base = this.getBaseUrl();
        if (!base) {
            throw new Error("Public API base URL is not configured");
        }
        const requestKey = `${lang}:${normalizedIds.join(",")}`;
        const existingRequest = inFlightProductBatchSummaries.get(requestKey);
        if (existingRequest) {
            return existingRequest;
        }

        const request = (async () => {
            const url = new URL(base + PublicEndpoints.productBatchSummary(lang));
            const res = await fetch(url.toString(), {
                method: "POST",
                cache: "no-store",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ids: normalizedIds}),
            });
            if (!res.ok) {
                throw await parseError(res);
            }
            const payload = await res.json() as Partial<IProductBatchSummaryResponse>;
            return {
                items: Array.isArray(payload.items) ? payload.items : [],
                missingIds: Array.isArray(payload.missingIds) ? payload.missingIds : [],
            };
        })();
        inFlightProductBatchSummaries.set(requestKey, request);
        try {
            return await request;
        } finally {
            if (inFlightProductBatchSummaries.get(requestKey) === request) {
                inFlightProductBatchSummaries.delete(requestKey);
            }
        }
    }

    public async getProductRecommendations(
        productId: number | string,
        lang: LocaleEnum,
        limit = 12
    ): Promise<IProductRecommendation[]> {
        const base = this.getBaseUrl()

        if (!base) {
            return [];
        }

        const path = PublicEndpoints.productRecommendations(lang, productId)
        const url = new URL(base + path)
        url.searchParams.set("limit", String(limit))

        const res = await fetch(url.toString(), {
            method: "GET",
            cache: "no-store",
            signal: AbortSignal.timeout(2500),
        })

        if (!res.ok) {
            throw await parseError(res)
        }

        const payload = await res.json()
        return Array.isArray(payload) ? payload : []
    }

    public async getProductReviews(params: IProductReviewListParams): Promise<Page<IProductReview>> {
        const base = this.getBaseUrl()

        if (!base) {
            return createEmptyPage<IProductReview>({page: params.page ?? 0, size: params.size ?? 15});
        }

        const path = PublicEndpoints.productReviews(params.lang, params.productId)
        const url = new URL(base + path)

        url.searchParams.set("page", String(params.page ?? 0))
        url.searchParams.set("size", String(params.size ?? 15))
        url.searchParams.set("sort", params.sort ?? "newest")

        if (params.rating != null) {
            url.searchParams.set("rating", String(params.rating))
        }

        if (params.hasText != null) {
            url.searchParams.set("hasText", String(params.hasText))
        }

        const res = await fetch(url.toString(), {
            method: "GET",
            cache: "no-cache",
            signal: params.signal,
        })

        if (!res.ok) {
            throw await parseError(res)
        }

        return normalizePageResponse<IProductReview>(await res.json(), {
            page: params.page ?? 0,
            size: params.size ?? 15,
        })
    }

    public async createProductReview(
        productId: number | string,
        payload: IProductReviewPayload
    ): Promise<IProductReviewSubmission> {
        const base = this.getBaseUrl()

        if (!base) {
            throw new Error("Public API is not configured")
        }

        const path = PublicEndpoints.submitProductReview(productId)
        const url = new URL(base + path)
        const res = await fetch(url.toString(), {
            method: "POST",
            cache: "no-cache",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        })

        if (!res.ok) {
            throw await parseError(res)
        }

        return res.json()
    }

    public async createCustomerRequest(payload: ICustomerRequestPayload): Promise<ICustomerRequestSubmission> {
        const base = this.getBaseUrl()

        if (!base) {
            throw new Error("Public API is not configured")
        }

        const path = PublicEndpoints.customerRequests()
        const url = new URL(base + path)
        const res = await fetch(url.toString(), {
            method: "POST",
            cache: "no-cache",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        })

        if (!res.ok) {
            throw await parseError(res)
        }

        return res.json()
    }

    public async getProductsList(params: IProductListParams): Promise<Page<IProduct>> {
        const base = this.getBaseUrl()

        if (!base || !params.categoryCode) {
            return this.emptyPage<IProduct>();
        }

        const path = PublicEndpoints.productsList(params.lang, params.categoryCode)
        const url = new URL(base + path)

        url.searchParams.set("page", String(params.page))
        url.searchParams.set("size", String(params.size))
        url.searchParams.set("sort", String(params.sort))

        const res = await fetch(url.toString(), {
            method: "GET",
            next: {
                revalidate: 30,
            },
        })

        if (!res.ok) {
            throw await parseError(res)
        }

        return normalizePageResponse<IProduct>(await res.json(), {
            page: params.page,
            size: params.size,
        })
    }

    public async getCatalogProducts(params: IProductListParams): Promise<Page<IProduct>> {
        const base = this.getBaseUrl()

        if (!base) {
            return this.emptyPage<IProduct>();
        }

        const path = PublicEndpoints.catalogProducts(params.lang)
        const url = new URL(base + path)

        if (params.categoryCode) {
            url.searchParams.set("categoryCode", params.categoryCode)
        }

        const search = normalizeCatalogQueryValue(params.search);
        const priceMin = normalizeCatalogQueryValue(params.priceMin);
        const priceMax = normalizeCatalogQueryValue(params.priceMax);

        if (search) {
            url.searchParams.set("search", search)
        }

        if (priceMin) {
            url.searchParams.set("priceMin", priceMin)
        }

        if (priceMax) {
            url.searchParams.set("priceMax", priceMax)
        }

        Object.entries(params.filters ?? {}).forEach(([key, values]) => {
            const filterKey = normalizeCatalogQueryValue(key);

            if (!filterKey) {
                return;
            }

            normalizeCatalogQueryValues(values).forEach((value) => url.searchParams.append(filterKey, value))
        })

        url.searchParams.set("page", String(params.page))
        url.searchParams.set("size", String(params.size))
        url.searchParams.set("sort", String(params.sort))

        const res = await fetch(url.toString(), {
            method: "GET",
            cache: "no-cache",
        })

        if (!res.ok) {
            throw await parseError(res)
        }

        return normalizePageResponse<IProduct>(await res.json(), {
            page: params.page,
            size: params.size,
        })
    }

    public async getQuickSearchProducts(params: {
        lang: LocaleEnum;
        query: string;
        limit?: number;
        signal?: AbortSignal;
    }): Promise<IQuickSearchProduct[]> {
        const base = this.getBaseUrl()
        const search = normalizeCatalogQueryValue(params.query);

        if (!base || !search || search.length < 2) {
            return [];
        }

        const path = PublicEndpoints.quickSearchProducts(params.lang)
        const url = new URL(base + path)

        url.searchParams.set("q", search)
        url.searchParams.set("limit", String(params.limit ?? 6))

        const res = await fetch(url.toString(), {
            method: "GET",
            cache: "no-cache",
            signal: params.signal,
        })

        if (!res.ok) {
            throw await parseError(res)
        }

        const payload = await res.json()
        return Array.isArray(payload) ? payload : []
    }

    public async getCatalogFilters(lang: LocaleEnum, categoryCode?: string): Promise<ICatalogFiltersResponse | null> {
        const base = this.getBaseUrl()

        if (!base) {
            return null;
        }

        const path = PublicEndpoints.catalogFilters(lang)
        const url = new URL(base + path)

        if (categoryCode) {
            url.searchParams.set("categoryCode", categoryCode)
        }

        const res = await fetch(url.toString(), {
            method: "GET",
            cache: "no-cache",
        })

        if (!res.ok) {
            throw await parseError(res)
        }

        return res.json()
    }

    public async trackProductEvent(params: {
        productId: number;
        eventType: ProductAnalyticsEventType;
        sessionId?: string;
    }): Promise<boolean> {
        const base = this.getBaseUrl()

        if (!base) {
            return false;
        }

        const path = PublicEndpoints.productAnalyticsEvents()
        const url = new URL(base + path)

        try {
            const res = await fetch(url.toString(), {
                method: "POST",
                cache: "no-cache",
                keepalive: true,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(params),
            })

            return res.ok;
        } catch {
            return false;
        }
    }

    public async getCmsPage(pageKey: string, lang: LocaleEnum): Promise<ICmsPage | null> {
        const base = this.getBaseUrl()

        if (!base) {
            return null;
        }

        const path = PublicEndpoints.cmsPage(pageKey)
        const url = new URL(base + path)

        url.searchParams.set("lang", lang)

        const res = await fetch(url.toString(), {
            method: "GET",
            next: {
                revalidate: 30,
                tags: ["cms", `cms:${pageKey}`],
            },
        })

        if (!res.ok) {
            throw await parseError(res)
        }

        return res.json()
    }

    private emptyPage<T>(): Page<T> {
        return {
            content: [],
            empty: true,
            first: true,
            last: true,
            number: 0,
            numberOfElements: 0,
            pageable: {
                offset: 0,
                pageNumber: 0,
                pageSize: 0,
                paged: true,
                sort: { empty: true, sorted: false, unsorted: true },
                unpaged: false,
            },
            size: 0,
            sort: { empty: true, sorted: false, unsorted: true },
            totalElements: 0,
            totalPages: 0,
        }
    }

    public async getCategoryList(lang: LocaleEnum): Promise<ICategory[]> {
        const base = this.getBaseUrl()

        if (!base) {
            return [];
        }

        const path = PublicEndpoints.categoryList(lang)
        const url = new URL(base + path)

        try{
            const res = await fetch(url.toString(), {
                method: "GET",
                next: {
                    revalidate: 3600,
                }
            })

            if (!res.ok) {
                throw await parseError(res)
            }

            const payload = await res.json()
            return Array.isArray(payload) ? payload : []
        } catch(err: unknown) {
            throw err;
        }
    }

    public async getCategoryByCode(code: string, lang: LocaleEnum): Promise<ICategoryWithParent | null> {
        const base = this.getBaseUrl()
        if (!base) {
            return null;
        }

        const path = PublicEndpoints.categoryByCode(code, lang)
        const url = new URL(base + path)

        try{
            const res = await fetch(url.toString(), {
                method: "GET",
                next: {
                    revalidate: 3600,
                }
            })

            if (!res.ok) {
                throw await parseError(res)
            }

            return res.json()
        } catch(err: unknown) {
            throw err;
        }
    }
}

export const PublicApiController: PublicController = new PublicController();
