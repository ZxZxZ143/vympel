import {LocaleEnum} from "@/i18n/routing";
import {ProductSortEnum} from "@/enums/SortEnum";

export interface IProductListParams {
    lang: LocaleEnum,
    categoryCode?: string,
    search?: string,
    priceMin?: string,
    priceMax?: string,
    filters?: Record<string, string[]>,
    page?: number,
    size?: number,
    sort?: ProductSortEnum
}

export interface IProductFeature {
    id: string,
    name: string,
}

export interface IProductBrand extends IProductFeature {
    country?: string[] | null;
}

export interface IProduct {
    id: number,
    name: string,
    model?: string | null,
    price: number,
    stockQuantity?: number | null;
    status?: string | null;
    imageUrl?: string | null,
    kaspiUrl?: string | null;
    wildberriesUrl?: string | null;
    collection: IProductFeature,
    ratingAverage?: number | null;
    ratingCount?: number | null;
}

export interface IProductRecommendation extends Omit<IProduct, "collection"> {
    collection?: IProductFeature | null;
}

export interface IProductBatchSummaryItem {
    id: number;
    name: string;
    model?: string | null;
    sku?: string | null;
    price: number;
    stockQuantity?: number | null;
    status?: string | null;
    imageUrl?: string | null;
    kaspiUrl?: string | null;
    wildberriesUrl?: string | null;
    collection?: IProductFeature | null;
    brand?: IProductFeature | null;
    categoryCode?: string | null;
    categoryName?: string | null;
    ratingAverage?: number | null;
    ratingCount?: number | null;
}

export interface IProductBatchSummaryResponse {
    items: IProductBatchSummaryItem[];
    missingIds: number[];
}

export interface IQuickSearchProduct {
    id: number;
    name: string;
    model?: string | null;
    sku?: string | null;
    brand?: IProductFeature | null;
    collection?: IProductFeature | null;
    price: number;
    oldPrice?: number | null;
    stockQuantity?: number | null;
    status?: string | null;
    imageUrl?: string | null;
}

export interface IProductDescription {
    shortText?: string | null;
    title?: string | null;
    content?: string | null;
}

export interface IProductImage {
    id: number;
    url: string;
    alt?: string | null;
    sortOrder: number;
    isMain: boolean;
}

export interface IProductWatchDetails {
    productId: number;
    mechanism?: IProductFeature | null;
    gender?: IProductFeature | null;
    caseMaterial?: IProductFeature | null;
    strapMaterial?: IProductFeature | null;
    glassType?: IProductFeature | null;
    caseSizeMm?: number | null;
    waterResistance?: string | null;
    stoneInlay?: IProductFeature | null;
}

export interface IProductInteriorClockDetails {
    productId: number;
    productionCountry?: IProductFeature | null;
    caseMaterial?: IProductFeature | null;
    color?: IProductFeature | null;
    style?: IProductFeature | null;
    mechanismType?: IProductFeature | null;
    powerType?: IProductFeature | null;
    dimensions?: string | null;
    weightGrams?: number | null;
    warrantyMonths?: number | null;
}

export interface ICatalogFilterOption {
    value: string;
    label: string;
    count: number;
    disabled: boolean;
}

export interface ICatalogFilter {
    key: string;
    label: string;
    type: "checkbox" | "range";
    source?: "product" | "brand_country" | "watch_details" | "interior_clock_details" | string;
    options: ICatalogFilterOption[];
    min?: number | null;
    max?: number | null;
}

export interface ICatalogCategoryContext {
    id?: number | null;
    slug?: string | null;
    label: string;
    parentSlug?: string | null;
    inheritsFiltersFrom?: string | null;
}

export interface ICatalogFiltersResponse {
    category: ICatalogCategoryContext;
    filters: ICatalogFilter[];
}

export interface IProductDetails {
    id: number;
    sku: string;
    name: string;
    model: string;
    price: number;
    stockQuantity?: number | null;
    status: string;
    productType: string;
    category?: {
        id: number;
        name: string;
        code: string;
        parentId: number | null;
    } | null;
    brand?: IProductBrand | null;
    collection?: IProductFeature | null;
    images: IProductImage[];
    description?: IProductDescription | null;
    watchDetails?: IProductWatchDetails | null;
    interiorClockDetails?: IProductInteriorClockDetails | null;
    kaspiUrl?: string | null;
    wildberriesUrl?: string | null;
    ratingAverage?: number | null;
    ratingCount?: number | null;
}

export type ProductReviewAuthorType = "GUEST" | "USER";

export type ProductReviewSort =
    | "newest"
    | "oldest"
    | "highestRating"
    | "lowestRating"
    | "positiveFirst"
    | "negativeFirst";

export interface IProductReviewListParams {
    productId: number | string;
    lang: LocaleEnum;
    page?: number;
    size?: number;
    sort?: ProductReviewSort;
    rating?: number | null;
    hasText?: boolean | null;
    signal?: AbortSignal;
}

export interface IProductReview {
    id: number;
    rating: number;
    text?: string | null;
    authorType: ProductReviewAuthorType;
    authorName?: string | null;
    createdAt: string;
}

export interface IProductReviewPayload {
    rating: number;
    text?: string | null;
}

export interface IProductReviewSubmission {
    id: number;
    status: "PENDING";
}

export interface ICustomerRequestPayload {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    message?: string | null;
    source?: string | null;
    website?: string | null;
}

export interface ICustomerRequestSubmission {
    id: number;
    status: "NEW";
}
