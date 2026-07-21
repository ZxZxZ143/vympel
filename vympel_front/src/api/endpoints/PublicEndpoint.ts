import {LocaleEnum} from "@/i18n/routing";

class PublicEndpoint {
    product = (lang: LocaleEnum, productId: number | string) => (
        `/product/${lang}/${productId}`
    );

    productReviews = (lang: LocaleEnum, productId: number | string) => (
        `/product/${lang}/${productId}/reviews`
    );

    productRecommendations = (lang: LocaleEnum, productId: number | string) => (
        `/product/${lang}/${productId}/recommendations`
    );

    productBatchSummary = (lang: LocaleEnum) => (
        `/product/batch-summary/${lang}`
    );

    submitProductReview = (productId: number | string) => (
        `/product/${productId}/reviews`
    );

    productsList = (lang: LocaleEnum, categoryCode: string) => (
        `/product/by-code` +
        `/${lang}` +
        `/${categoryCode}`
    );

    catalogProducts = (lang: LocaleEnum) => (
        `/product/catalog/${lang}`
    );

    quickSearchProducts = (lang: LocaleEnum) => (
        `/product/search/quick/${lang}`
    );

    catalogFilters = (lang: LocaleEnum) => (
        `/product/filters/${lang}`
    );

    productAnalyticsEvents = () => (
        `/analytics/products/events`
    );

    customerRequests = () => (
        `/requests`
    );

    cmsPage = (pageKey: string) => (
        `/cms/pages/${encodeURIComponent(pageKey)}`
    );

    categoryList = (lang: LocaleEnum) => (
        `/category/all/` + lang
    );
    categoryByCode = (code: string, lang: LocaleEnum) => (
        `/category/${lang}/${code}`
    )
}

export const PublicEndpoints: PublicEndpoint = new PublicEndpoint();
