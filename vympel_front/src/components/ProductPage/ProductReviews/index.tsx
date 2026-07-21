"use client";

import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {usePathname, useSearchParams} from "next/navigation";
import {Controller, useForm} from "react-hook-form";
import {Star} from "lucide-react";
import {useLocale, useTranslations} from "use-intl";
import {toast} from "sonner";

import {normalizePageResponse, Page, PageResponseLike} from "@/api/types/PageType";
import {IProductReview, ProductReviewSort} from "@/api/types/ProductTypes";
import {PublicApiController} from "@/api/controllers/PublicController";
import {ApiError} from "@/api/types/ApiError";
import RatingStars from "@/components/ProductRating/RatingStars";
import Button from "@/components/ui/shared/Button";
import DropdownSelect, {type DropdownSelectOption} from "@/components/ui/shared/DropdownSelect";
import {Heading} from "@/components/ui/shared/text/Heading";
import {Text} from "@/components/ui/shared/text";
import {LocaleEnum} from "@/i18n/routing";
import {cn} from "@/lib/utils";

export type ProductReviewsProps = {
    productId: number;
    initialReviewsPage: PageResponseLike<IProductReview> | null | undefined;
    loadError: boolean;
    ratingAverage?: number | null;
    ratingCount?: number | null;
};

type ReviewFormValues = {
    rating: number;
    text: string;
};

type RatingFilterValue = "all" | "5" | "4" | "3" | "2" | "1";
type TextFilterValue = "all" | "with" | "without";

type ReviewQueryState = {
    page: number;
    sort: ProductReviewSort;
    rating: RatingFilterValue;
    text: TextFilterValue;
};

const REVIEW_PAGE_SIZE = 15;
const MAX_VISIBLE_REVIEW_PAGES = 5;
const DEFAULT_REVIEW_QUERY: ReviewQueryState = {
    page: 1,
    sort: "newest",
    rating: "all",
    text: "all",
};
const REVIEW_SORT_VALUES: ProductReviewSort[] = [
    "newest",
    "oldest",
    "highestRating",
    "lowestRating",
    "positiveFirst",
    "negativeFirst",
];
const RATING_FILTER_VALUES: RatingFilterValue[] = ["all", "5", "4", "3", "2", "1"];
const TEXT_FILTER_VALUES: TextFilterValue[] = ["all", "with", "without"];
const normalizeReviewPage = (
    response: PageResponseLike<IProductReview> | null | undefined | unknown,
    page = 0
): Page<IProductReview> => normalizePageResponse<IProductReview>(response, {
    page,
    size: REVIEW_PAGE_SIZE,
});

const ProductReviews = ({
                            productId,
                            initialReviewsPage,
                            loadError,
                            ratingAverage,
                            ratingCount,
                        }: ProductReviewsProps) => {
    const t = useTranslations("product.reviews");
    const locale = useLocale() as LocaleEnum;
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const reviewListTopId = `product-reviews-list-${productId}`;
    const {
        control,
        formState: {errors, isSubmitting},
        handleSubmit,
        register,
        reset,
    } = useForm<ReviewFormValues>({
        defaultValues: {
            rating: 0,
            text: "",
        },
    });
    const approvedCount = ratingCount ?? 0;
    const dateFormatter = useMemo(() => (
        new Intl.DateTimeFormat(locale, {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
    ), [locale]);
    const [reviewQuery, setReviewQuery] = useState<ReviewQueryState>(() => parseReviewQuery(searchParams));
    const [reviewsPage, setReviewsPage] = useState<Page<IProductReview>>(() => (
        normalizeReviewPage(initialReviewsPage)
    ));
    const [isReviewsLoading, setReviewsLoading] = useState(false);
    const [reviewsLoadError, setReviewsLoadError] = useState(loadError);
    const [submitRetryAfterSeconds, setSubmitRetryAfterSeconds] = useState(0);
    const initialDefaultDataHandledRef = useRef(false);

    useEffect(() => {
        if (submitRetryAfterSeconds <= 0) return;
        const timer = window.setTimeout(
            () => setSubmitRetryAfterSeconds((seconds) => Math.max(0, seconds - 1)),
            1000
        );
        return () => window.clearTimeout(timer);
    }, [submitRetryAfterSeconds]);

    const sortOptions = useMemo<DropdownSelectOption<ProductReviewSort>[]>(() => (
        REVIEW_SORT_VALUES.map((value) => ({
            value,
            label: t(`sort.${value}`),
        }))
    ), [t]);

    const ratingOptions = useMemo<DropdownSelectOption<RatingFilterValue>[]>(() => (
        RATING_FILTER_VALUES.map((value) => ({
            value,
            label: value === "all" ? t("filters.ratingAll") : t("filters.ratingStars", {rating: Number(value)}),
        }))
    ), [t]);

    const textOptions = useMemo<DropdownSelectOption<TextFilterValue>[]>(() => (
        TEXT_FILTER_VALUES.map((value) => ({
            value,
            label: t(`filters.text.${value}`),
        }))
    ), [t]);

    const selectedSortLabel = optionLabel(sortOptions, reviewQuery.sort);
    const selectedRatingLabel = optionLabel(ratingOptions, reviewQuery.rating);
    const selectedTextLabel = optionLabel(textOptions, reviewQuery.text);
    const hasActiveReviewFilters = reviewQuery.rating !== "all" || reviewQuery.text !== "all";
    const hasChangedReviewControls = hasActiveReviewFilters || reviewQuery.sort !== DEFAULT_REVIEW_QUERY.sort;
    const activeControlLabels = [
        reviewQuery.sort !== DEFAULT_REVIEW_QUERY.sort ? t("activeSort", {value: selectedSortLabel}) : null,
        reviewQuery.rating !== "all" ? t("activeFilter", {value: selectedRatingLabel}) : null,
        reviewQuery.text !== "all" ? t("activeFilter", {value: selectedTextLabel}) : null,
    ].filter((value): value is string => Boolean(value));

    const syncReviewQueryToUrl = useCallback((nextQuery: ReviewQueryState, mode: "push" | "replace" = "push") => {
        if (typeof window === "undefined") {
            return;
        }

        const params = new URLSearchParams(window.location.search);
        setReviewParam(params, "reviewPage", nextQuery.page === DEFAULT_REVIEW_QUERY.page ? null : String(nextQuery.page));
        setReviewParam(params, "reviewSort", nextQuery.sort === DEFAULT_REVIEW_QUERY.sort ? null : nextQuery.sort);
        setReviewParam(params, "reviewRating", nextQuery.rating === DEFAULT_REVIEW_QUERY.rating ? null : nextQuery.rating);
        setReviewParam(params, "reviewText", nextQuery.text === DEFAULT_REVIEW_QUERY.text ? null : nextQuery.text);

        const query = params.toString();
        const hash = window.location.hash;
        const nextUrl = `${pathname}${query ? `?${query}` : ""}${hash}`;
        const currentState = window.history.state && typeof window.history.state === "object"
            ? window.history.state
            : {};

        window.history[mode === "replace" ? "replaceState" : "pushState"](
            {...currentState, productReviews: nextQuery},
            "",
            nextUrl
        );
    }, [pathname]);

    const scrollToReviewList = useCallback(() => {
        if (typeof window === "undefined") {
            return;
        }

        window.requestAnimationFrame(() => {
            const target = document.getElementById(reviewListTopId);

            if (!target) {
                return;
            }

            const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            target.scrollIntoView({
                behavior: prefersReducedMotion ? "auto" : "smooth",
                block: "start",
            });
        });
    }, [reviewListTopId]);

    const updateReviewQuery = useCallback((
        nextQuery: ReviewQueryState,
        options: {replace?: boolean; scroll?: boolean} = {}
    ) => {
        const normalizedQuery = normalizeReviewQuery(nextQuery);

        setReviewQuery(normalizedQuery);
        syncReviewQueryToUrl(normalizedQuery, options.replace ? "replace" : "push");

        if (options.scroll) {
            scrollToReviewList();
        }
    }, [scrollToReviewList, syncReviewQueryToUrl]);

    useEffect(() => {
        const onPopState = () => {
            setReviewQuery(parseReviewQuery(new URLSearchParams(window.location.search)));
            scrollToReviewList();
        };

        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
    }, [scrollToReviewList]);

    useEffect(() => {
        if (!initialDefaultDataHandledRef.current && isDefaultReviewQuery(reviewQuery)) {
            initialDefaultDataHandledRef.current = true;
            return;
        }

        initialDefaultDataHandledRef.current = true;
        const abortController = new AbortController();
        let active = true;

        const fetchReviews = async () => {
            setReviewsLoading(true);
            setReviewsLoadError(false);

            try {
                const loadedPage = await PublicApiController.getProductReviews({
                    productId,
                    lang: locale,
                    page: reviewQuery.page - 1,
                    size: REVIEW_PAGE_SIZE,
                    sort: reviewQuery.sort,
                    rating: reviewQuery.rating === "all" ? null : Number(reviewQuery.rating),
                    hasText: toHasTextParam(reviewQuery.text),
                    signal: abortController.signal,
                });
                const normalizedPage = normalizeReviewPage(loadedPage, reviewQuery.page - 1);

                if (!active || abortController.signal.aborted) {
                    return;
                }

                if (normalizedPage.totalPages > 0 && reviewQuery.page > normalizedPage.totalPages) {
                    updateReviewQuery({...reviewQuery, page: normalizedPage.totalPages}, {replace: true});
                    return;
                }

                setReviewsPage(normalizedPage);
            } catch (error) {
                if (!active || abortController.signal.aborted) {
                    return;
                }

                console.error(error);
                setReviewsLoadError(true);
            } finally {
                if (active && !abortController.signal.aborted) {
                    setReviewsLoading(false);
                }
            }
        };

        void fetchReviews();

        return () => {
            active = false;
            abortController.abort();
        };
    }, [locale, productId, reviewQuery, updateReviewQuery]);

    const submitReview = async (values: ReviewFormValues) => {
        try {
            await PublicApiController.createProductReview(productId, {
                rating: values.rating,
                text: values.text.trim() || null,
            });
            reset();
            toast.success(t("sentForModeration"));
        } catch (error) {
            if (error instanceof ApiError && error.status === 429) {
                const retryAfter = Math.max(1, error.retryAfterSeconds ?? 60);
                setSubmitRetryAfterSeconds(retryAfter);
                toast.error(t("rateLimit", {seconds: retryAfter}));
                return;
            }
            toast.error(t("submitError"));
        }
    };

    const resetReviewControls = () => {
        updateReviewQuery(DEFAULT_REVIEW_QUERY, {scroll: true});
    };

    const normalizedReviewsPage = normalizeReviewPage(reviewsPage, reviewQuery.page - 1);
    const reviewItems = normalizedReviewsPage.content;
    const showFilteredEmptyState = hasActiveReviewFilters && normalizedReviewsPage.totalElements === 0;

    return (
        <section aria-labelledby="product-reviews-title" className="overflow-visible pb-14 pt-10 sm:pb-18 sm:pt-12">
            <div className="grid gap-10 overflow-visible lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] lg:items-start lg:gap-18">
                <aside className="lg:sticky lg:top-product-review-sticky-top lg:self-start">
                    <Heading id="product-reviews-title" as="h2" size="h3" weight="regular">
                        {t("title")}
                    </Heading>

                    <div className="mt-6 flex flex-wrap items-center gap-4">
                        <RatingStars
                            value={ratingAverage ?? 0}
                            ariaLabel={t("ratingAria", {rating: ratingAverage?.toFixed(1) ?? "0"})}
                            starClassName="size-5"
                        />
                        <Text as="span" size="bodyLg" weight="medium">
                            {approvedCount > 0 && ratingAverage != null ? ratingAverage.toFixed(1) : t("noRating")}
                        </Text>
                        <Text as="span" size="bodySm" colors="muted">
                            {t("reviewsCount", {count: approvedCount})}
                        </Text>
                    </div>

                    <form className="mt-10 grid gap-6" onSubmit={handleSubmit(submitReview)} noValidate>
                        <Controller
                            name="rating"
                            control={control}
                            rules={{
                                validate: (value) => value >= 1 || t("ratingRequired"),
                            }}
                            render={({field}) => (
                                <fieldset className="grid gap-3" disabled={isSubmitting}>
                                    <Text as="legend" size="bodySm" weight="medium">
                                        {t("yourRating")}
                                    </Text>
                                    <div className="flex gap-2">
                                        {Array.from({length: 5}, (_, index) => {
                                            const rating = index + 1;
                                            const selected = rating <= field.value;
                                            return (
                                                <button
                                                    key={rating}
                                                    type="button"
                                                    aria-label={t("selectRating", {rating})}
                                                    aria-pressed={field.value === rating}
                                                    onClick={() => field.onChange(rating)}
                                                    className={cn(
                                                        "rounded-full p-1 text-border-default transition focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40",
                                                        selected && "text-text-product-secondary"
                                                    )}
                                                >
                                                    <Star
                                                        aria-hidden="true"
                                                        className={cn("size-8", selected && "fill-current")}
                                                    />
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {errors.rating?.message ? (
                                        <Text role="alert" size="caption" className="text-error">
                                            {errors.rating.message}
                                        </Text>
                                    ) : null}
                                </fieldset>
                            )}
                        />

                        <label className="grid gap-3">
                            <Text as="span" size="bodySm" weight="medium">
                                {t("reviewText")}
                            </Text>
                            <textarea
                                {...register("text", {
                                    maxLength: {
                                        value: 2000,
                                        message: t("textTooLong"),
                                    },
                                    validate: (value) => !/[<>]/.test(value) || t("textInvalid"),
                                })}
                                disabled={isSubmitting}
                                maxLength={2000}
                                placeholder={t("reviewPlaceholder")}
                                className={cn(
                                    "min-h-32 w-full resize-y rounded-2xl border border-border-default bg-primary-bg px-5 py-4 text-sm text-text-primary outline-none transition placeholder:text-text-placeholder focus:border-text-heading-secondary",
                                    errors.text && "border-error"
                                )}
                            />
                            {errors.text?.message ? (
                                <Text role="alert" size="caption" className="text-error">
                                    {errors.text.message}
                                </Text>
                            ) : null}
                        </label>

                        <Button
                            type="submit"
                            variant="action"
                            isLoading={isSubmitting}
                            disabled={isSubmitting || submitRetryAfterSeconds > 0}
                            className="w-full sm:w-fit"
                        >
                            {isSubmitting
                                ? t("sending")
                                : submitRetryAfterSeconds > 0
                                    ? t("retryIn", {seconds: submitRetryAfterSeconds})
                                    : t("send")}
                        </Button>
                        <Text size="caption" colors="muted">
                            {t("moderationHint")}
                        </Text>
                    </form>
                </aside>

                <div id={reviewListTopId} className="scroll-mt-24 lg:scroll-mt-product-review-sticky-top">
                    <div className="mb-6 rounded-2xl border border-border-default bg-primary-bg p-4 sm:p-5">
                        <div className="flex flex-wrap items-end gap-3">
                            <DropdownSelect
                                id="review-rating-filter"
                                label={t("filters.ratingLabel")}
                                value={reviewQuery.rating}
                                options={ratingOptions}
                                onChange={(rating) => updateReviewQuery({...reviewQuery, rating, page: 1}, {scroll: true})}
                            />
                            <DropdownSelect
                                id="review-text-filter"
                                label={t("filters.textLabel")}
                                value={reviewQuery.text}
                                options={textOptions}
                                onChange={(text) => updateReviewQuery({...reviewQuery, text, page: 1}, {scroll: true})}
                            />
                            <DropdownSelect
                                id="review-sort"
                                label={t("sort.label")}
                                value={reviewQuery.sort}
                                options={sortOptions}
                                onChange={(sort) => updateReviewQuery({...reviewQuery, sort, page: 1}, {scroll: true})}
                            />
                            {hasChangedReviewControls ? (
                                <Button
                                    size="sm"
                                    variant="default"
                                    className="min-h-11"
                                    onClick={resetReviewControls}
                                >
                                    {t("filters.reset")}
                                </Button>
                            ) : null}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            {activeControlLabels.length ? (
                                <>
                                    <Text size="caption" colors="muted">
                                        {t("activeControls")}
                                    </Text>
                                    {activeControlLabels.map((label) => (
                                        <span
                                            key={label}
                                            className="rounded-full border border-border-default px-3 py-1 text-xs text-text-heading-secondary"
                                        >
                                            {label}
                                        </span>
                                    ))}
                                </>
                            ) : (
                                <Text size="caption" colors="muted">
                                    {t("defaultControls")}
                                </Text>
                            )}
                            {isReviewsLoading ? (
                                <Text size="caption" colors="muted" role="status" aria-live="polite">
                                    {t("updating")}
                                </Text>
                            ) : null}
                        </div>
                    </div>

                    {reviewsLoadError ? (
                        <div className="rounded-2xl border border-error/40 p-6">
                            <Heading as="h3" size="h6" weight="medium">
                                {t("loadErrorTitle")}
                            </Heading>
                            <Text className="mt-3" colors="muted">
                                {t("loadErrorDescription")}
                            </Text>
                        </div>
                    ) : reviewItems.length ? (
                        <>
                            <div className={cn("grid gap-5 transition", isReviewsLoading && "opacity-60")}>
                                {reviewItems.map((review) => {
                                    const author = review.authorName?.trim()
                                        || (review.authorType === "GUEST" ? t("guest") : t("user"));
                                    return (
                                        <article key={review.id} className="rounded-2xl border border-border-default p-6">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div>
                                                    <Text weight="medium">{author}</Text>
                                                    <Text size="caption" colors="muted" className="mt-1">
                                                        {dateFormatter.format(new Date(review.createdAt))}
                                                    </Text>
                                                </div>
                                                <RatingStars
                                                    value={review.rating}
                                                    ariaLabel={t("ratingAria", {rating: review.rating})}
                                                />
                                            </div>
                                            <Text className="mt-5 whitespace-pre-wrap leading-7" colors="secondary">
                                                {review.text || t("ratingOnly")}
                                            </Text>
                                        </article>
                                    );
                                })}
                            </div>

                            <ReviewPagination
                                pageData={normalizedReviewsPage}
                                onPageChange={(page) => updateReviewQuery({...reviewQuery, page}, {scroll: true})}
                                labels={{
                                    ariaLabel: t("pagination.ariaLabel"),
                                    previous: t("pagination.previous"),
                                    next: t("pagination.next"),
                                    page: (page) => t("pagination.page", {page}),
                                    pageAria: (page) => t("pagination.pageAria", {page}),
                                }}
                            />
                        </>
                    ) : (
                        <div className="rounded-2xl border border-border-default p-8 text-center">
                            <Heading as="h3" size="h5" weight="regular">
                                {showFilteredEmptyState ? t("filteredEmptyTitle") : t("emptyTitle")}
                            </Heading>
                            <Text className="mt-3" colors="muted">
                                {showFilteredEmptyState ? t("filteredEmptyDescription") : t("emptyDescription")}
                            </Text>
                            {hasChangedReviewControls ? (
                                <Button
                                    size="sm"
                                    variant="default"
                                    className="mt-6"
                                    onClick={resetReviewControls}
                                >
                                    {t("filters.reset")}
                                </Button>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

const ReviewPagination = ({pageData, onPageChange, labels}: ReviewPaginationProps) => {
    const currentPage = Math.min(Math.max(pageData.number + 1, 1), Math.max(pageData.totalPages, 1));

    const visiblePages = useMemo(() => {
        if (pageData.totalPages <= MAX_VISIBLE_REVIEW_PAGES) {
            return Array.from({length: pageData.totalPages}, (_, index) => index + 1);
        }

        const half = Math.floor(MAX_VISIBLE_REVIEW_PAGES / 2);
        const startPage = Math.min(
            Math.max(currentPage - half, 1),
            pageData.totalPages - MAX_VISIBLE_REVIEW_PAGES + 1
        );

        return Array.from({length: MAX_VISIBLE_REVIEW_PAGES}, (_, index) => startPage + index);
    }, [currentPage, pageData.totalPages]);

    const renderPaginationButton = (pageNumber: number) => {
        const isActive = pageNumber === currentPage;

        return (
            <button
                key={pageNumber}
                type="button"
                onClick={() => onPageChange(pageNumber)}
                aria-label={labels.pageAria(pageNumber)}
                aria-current={isActive ? "page" : undefined}
                disabled={isActive}
                className={cn(
                    "flex h-11 min-w-11 cursor-pointer items-center justify-center rounded-full border px-3 transition",
                    "hover:border-text-heading-primary hover:bg-surface-card",
                    "disabled:cursor-default",
                    isActive
                        ? "border-text-heading-primary bg-button-bg-action text-text-inverse hover:text-text-heading-secondary"
                        : "border-border-default bg-primary-bg text-text-heading-secondary"
                )}
            >
                <Text
                    size="bodyLg"
                    font="sans"
                    weight={isActive ? "semibold" : "regular"}
                    colors={isActive ? "inverse" : "headingSecondary"}
                    className="leading-none transition"
                >
                    {pageNumber}
                </Text>
            </button>
        );
    };

    if (pageData.totalPages <= 1) {
        return null;
    }

    return (
        <nav aria-label={labels.ariaLabel} className="mt-8 w-full overflow-hidden">
            <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-3 sm:flex-nowrap">
                <Button
                    size="sm"
                    variant="default"
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="min-h-11"
                >
                    {labels.previous}
                </Button>

                <div className="catalog-filter-scroll min-w-0 max-w-full flex-1 overflow-x-auto overflow-y-hidden pb-2">
                    <div className="flex w-max min-w-full flex-nowrap items-center justify-center gap-3">
                        {visiblePages[0] !== 1 ? (
                            <>
                                {renderPaginationButton(1)}
                                <Text
                                    size="bodyLg"
                                    font="sans"
                                    weight="regular"
                                    colors="secondary"
                                    className="leading-none"
                                >
                                    ...
                                </Text>
                            </>
                        ) : null}

                        {visiblePages.map(renderPaginationButton)}

                        {visiblePages.at(-1) !== pageData.totalPages ? (
                            <>
                                <Text
                                    size="bodyLg"
                                    font="sans"
                                    weight="regular"
                                    colors="secondary"
                                    className="leading-none"
                                >
                                    ...
                                </Text>
                                {renderPaginationButton(pageData.totalPages)}
                            </>
                        ) : null}
                    </div>
                </div>

                <Button
                    size="sm"
                    variant="default"
                    disabled={currentPage >= pageData.totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="min-h-11"
                >
                    {labels.next}
                </Button>

                <Text className="w-full text-center sm:hidden" size="caption" colors="muted">
                    {labels.page(currentPage)}
                </Text>
            </div>
        </nav>
    );
};

export default ProductReviews;

type ReviewPaginationProps = {
    pageData: Page<IProductReview>;
    onPageChange: (page: number) => void;
    labels: {
        ariaLabel: string;
        previous: string;
        next: string;
        page: (page: number) => string;
        pageAria: (page: number) => string;
    };
};

function parseReviewQuery(searchParams: { get(name: string): string | null } | null): ReviewQueryState {
    return normalizeReviewQuery({
        page: parsePositiveInt(searchParams?.get("reviewPage"), DEFAULT_REVIEW_QUERY.page),
        sort: parseReviewSort(searchParams?.get("reviewSort")),
        rating: parseRatingFilter(searchParams?.get("reviewRating")),
        text: parseTextFilter(searchParams?.get("reviewText")),
    });
}

function normalizeReviewQuery(query: ReviewQueryState): ReviewQueryState {
    return {
        page: Math.max(query.page, 1),
        sort: REVIEW_SORT_VALUES.includes(query.sort) ? query.sort : DEFAULT_REVIEW_QUERY.sort,
        rating: RATING_FILTER_VALUES.includes(query.rating) ? query.rating : DEFAULT_REVIEW_QUERY.rating,
        text: TEXT_FILTER_VALUES.includes(query.text) ? query.text : DEFAULT_REVIEW_QUERY.text,
    };
}

function parsePositiveInt(value: string | null | undefined, fallback: number): number {
    if (!value) {
        return fallback;
    }

    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseReviewSort(value: string | null | undefined): ProductReviewSort {
    return REVIEW_SORT_VALUES.includes(value as ProductReviewSort)
        ? value as ProductReviewSort
        : DEFAULT_REVIEW_QUERY.sort;
}

function parseRatingFilter(value: string | null | undefined): RatingFilterValue {
    return RATING_FILTER_VALUES.includes(value as RatingFilterValue)
        ? value as RatingFilterValue
        : DEFAULT_REVIEW_QUERY.rating;
}

function parseTextFilter(value: string | null | undefined): TextFilterValue {
    return TEXT_FILTER_VALUES.includes(value as TextFilterValue)
        ? value as TextFilterValue
        : DEFAULT_REVIEW_QUERY.text;
}

function isDefaultReviewQuery(query: ReviewQueryState): boolean {
    return query.page === DEFAULT_REVIEW_QUERY.page
        && query.sort === DEFAULT_REVIEW_QUERY.sort
        && query.rating === DEFAULT_REVIEW_QUERY.rating
        && query.text === DEFAULT_REVIEW_QUERY.text;
}

function toHasTextParam(textFilter: TextFilterValue): boolean | null {
    if (textFilter === "with") {
        return true;
    }

    if (textFilter === "without") {
        return false;
    }

    return null;
}

function setReviewParam(params: URLSearchParams, key: string, value: string | null) {
    if (value) {
        params.set(key, value);
        return;
    }

    params.delete(key);
}

function optionLabel<TValue extends string>(options: DropdownSelectOption<TValue>[], value: TValue): string {
    return options.find((option) => option.value === value)?.label ?? value;
}
