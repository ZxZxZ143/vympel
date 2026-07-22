"use client";

import Image from "next/image";
import {Search, X} from "lucide-react";
import {useCallback, useEffect, useId, useRef, useState} from "react";
import {useForm, useWatch} from "react-hook-form";
import {useLocale, useTranslations} from "use-intl";

import {IQuickSearchProduct} from "@/api/types/ProductTypes";
import {LocaleEnum} from "@/i18n/routing";
import {Link, useRouter} from "@/i18n/navigation";
import {PublicApiController} from "@/api/controllers/PublicController";
import {ApiError} from "@/api/types/ApiError";
import Button from "@/components/ui/shared/Button";
import {Text} from "@/components/ui/shared/text";
import {routes} from "@/config/routes";
import {cn} from "@/lib/utils";
import ProductImageFallback from "@/components/ui/shared/ProductImageFallback";
import {formatProductPrice} from "@/utils/formatProductPrice";
import {isProductUnavailable} from "@/services/localProductStorage";
import {useCatalogOverlay} from "@/components/CatalogPage/CatalogOverlayProvider";
import {
    CATALOG_TOOLBAR_CONTROL_HEIGHT_CLASS,
    getCatalogSearchRestoreTarget,
} from "@/components/CatalogPage/CatalogOverlayProvider/state";

const MIN_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 250;
const QUICK_SEARCH_LIMIT = 6;

type SearchStatus = "idle" | "loading" | "success" | "error" | "rateLimited";

export type SmartSearchVariant = "home" | "header" | "catalog" | "product";

type SmartSearchProps = {
    className?: string;
    mobileIconOnly?: boolean;
    onOpen?: () => void;
    variant?: SmartSearchVariant;
};

type SmartSearchFormValues = {
    query: string;
};

const SmartSearch = ({className, mobileIconOnly = false, onOpen, variant = "header"}: SmartSearchProps) => {
    const router = useRouter();
    const locale = useLocale();
    const panelId = useId();
    const navT = useTranslations("nav.search");
    const productT = useTranslations("product.search");
    const goodT = useTranslations("good");
    const {
        activeOverlay,
        closeOverlay: closeCatalogOverlay,
        openOverlay: openCatalogOverlay,
    } = useCatalogOverlay();
    const rootRef = useRef<HTMLDivElement | null>(null);
    const catalogSearchTriggerRef = useRef<HTMLButtonElement | null>(null);
    const {control, handleSubmit, register, setFocus, setValue} = useForm<SmartSearchFormValues>({
        defaultValues: {
            query: "",
        },
    });
    const query = useWatch({control, name: "query"}) ?? "";
    const [isOpen, setOpen] = useState(false);
    const [status, setStatus] = useState<SearchStatus>("idle");
    const [results, setResults] = useState<IQuickSearchProduct[]>([]);
    const [retryKey, setRetryKey] = useState(0);
    const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);

    const isHomeSearch = variant === "home" || variant === "header";
    const isHomePageSearch = variant === "home";
    const isToolbarSearch = variant === "catalog" || variant === "product";
    const coordinatesCatalogOverlay = variant === "catalog";
    const isSearchOpen = coordinatesCatalogOverlay ? activeOverlay === "search" : isOpen;
    const usesHostOverlay = isHomePageSearch || isToolbarSearch;
    const normalizedQuery = query.trim();
    const canSearch = normalizedQuery.length >= MIN_QUERY_LENGTH;
    const usesInlineSubmit = !isHomeSearch;
    const usesMobileIconTrigger = mobileIconOnly && usesInlineSubmit && !isSearchOpen;
    const usesMobileIconOverlay = mobileIconOnly && usesInlineSubmit && isSearchOpen;
    const ariaLabel = isHomeSearch ? navT("ariaLabel") : productT("ariaLabel");
    const placeholder = isHomeSearch ? navT("placeholder") : productT("placeholder");
    const submitLabel = isHomeSearch ? navT("submit") : productT("submit");

    const closeOverlay = useCallback(() => {
        if (coordinatesCatalogOverlay) {
            closeCatalogOverlay("search");
        } else {
            setOpen(false);
        }
    }, [closeCatalogOverlay, coordinatesCatalogOverlay]);

    const openOverlay = useCallback(() => {
        onOpen?.();
        if (coordinatesCatalogOverlay) {
            const trigger = getCatalogSearchRestoreTarget(
                mobileIconOnly && matchesCompactSearchViewport(variant),
                catalogSearchTriggerRef.current
            );
            openCatalogOverlay("search", trigger);
        } else {
            setOpen(true);
        }

        if (canSearch) {
            setStatus("loading");
        }
    }, [canSearch, coordinatesCatalogOverlay, mobileIconOnly, onOpen, openCatalogOverlay, variant]);

    const updateQuery = useCallback((nextQuery: string) => {
        const nextCanSearch = nextQuery.trim().length >= MIN_QUERY_LENGTH;

        onOpen?.();
        if (coordinatesCatalogOverlay) {
            const trigger = getCatalogSearchRestoreTarget(
                mobileIconOnly && matchesCompactSearchViewport(variant),
                catalogSearchTriggerRef.current
            );
            openCatalogOverlay("search", trigger);
        } else {
            setOpen(true);
        }

        if (nextCanSearch) {
            setStatus("loading");
            return;
        }

        setResults([]);
        setStatus("idle");
    }, [coordinatesCatalogOverlay, mobileIconOnly, onOpen, openCatalogOverlay, variant]);

    const submitSearch = useCallback((values?: SmartSearchFormValues) => {
        const searchQuery = (values?.query ?? query).trim();

        if (!searchQuery) {
            return;
        }

        closeOverlay();
        router.push(routes.searchCatalog(searchQuery));
    }, [closeOverlay, query, router]);

    useEffect(() => {
        const handlePointerDown = (event: MouseEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                closeOverlay();
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closeOverlay();
            }
        };

        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [closeOverlay]);

    useEffect(() => {
        if (!isSearchOpen || !canSearch) {
            return;
        }

        const abortController = new AbortController();

        const timeoutId = window.setTimeout(() => {
            PublicApiController.getQuickSearchProducts({
                lang: locale as LocaleEnum,
                query: normalizedQuery,
                limit: QUICK_SEARCH_LIMIT,
                signal: abortController.signal,
            })
                .then((products) => {
                    if (abortController.signal.aborted) {
                        return;
                    }

                    setResults(products);
                    setStatus("success");
                })
                .catch((error: unknown) => {
                    if (abortController.signal.aborted) {
                        return;
                    }

                    setResults([]);
                    if (error instanceof ApiError && error.status === 429) {
                        setRetryAfterSeconds(Math.max(1, error.retryAfterSeconds ?? 30));
                        setStatus("rateLimited");
                    } else {
                        setStatus("error");
                    }
                });
        }, SEARCH_DEBOUNCE_MS);

        return () => {
            window.clearTimeout(timeoutId);
            abortController.abort();
        };
    }, [canSearch, isSearchOpen, locale, normalizedQuery, retryKey]);

    useEffect(() => {
        if (retryAfterSeconds <= 0) return;
        const timer = window.setTimeout(() => setRetryAfterSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
        return () => window.clearTimeout(timer);
    }, [retryAfterSeconds]);

    const clearSearch = () => {
        setValue("query", "", {shouldDirty: true});
        setResults([]);
        setStatus("idle");
        if (!coordinatesCatalogOverlay) {
            setOpen(true);
        }
        setFocus("query");
    };

    const retrySearch = () => {
        setStatus("loading");
        setRetryKey((current) => current + 1);
        if (!coordinatesCatalogOverlay) {
            setOpen(true);
        }
        setFocus("query");
    };

    const openMobileIconSearch = () => {
        openOverlay();
        window.requestAnimationFrame(() => setFocus("query"));
    };

    const queryField = register("query");

    return (
        <div
            ref={rootRef}
            data-open={isSearchOpen ? "true" : "false"}
            data-mobile-icon-only={mobileIconOnly ? "true" : "false"}
            data-search-variant={variant}
            onMouseDown={(event) => {
                if (usesHostOverlay && isSearchOpen && event.target === event.currentTarget) {
                    closeOverlay();
                }
            }}
            className={cn(
                "min-h-12 w-full transition-vympel motion-reduce:transition-none",
                variant === "header" && "lg:relative xl:max-w-search-overlay-header-inactive-width",
                isHomePageSearch && "home-search-root",
                isToolbarSearch && "toolbar-search-root",
                className
            )}
        >
            <div
                className={cn(
                    "rounded-2xl w-full transition-vympel motion-reduce:transition-none",
                    isHomePageSearch && "home-search-frame",
                    isToolbarSearch && "toolbar-search-frame",
                    usesHostOverlay
                        ? isSearchOpen && cn("bg-primary-bg shadow-state", coordinatesCatalogOverlay ? "min-[1440px]:shadow-none" : "lg:shadow-none")
                        : isSearchOpen
                            ? "absolute inset-x-0 top-0 z-50 bg-primary-bg"
                            : "relative z-10",
                    !usesHostOverlay && isSearchOpen && isHomeSearch && "responsive-page-x",
                    !usesHostOverlay && isSearchOpen && !isHomeSearch && (
                        usesMobileIconOverlay
                            ? "max-lg:px-search-overlay-mobile-toolbar-inset max-lg:py-0"
                            : "p-5 sm:px-9.5 sm:py-7.5 lg:p-0"
                    )
                )}
            >
                <div
                    className={cn(
                        "relative w-full transition-vympel motion-reduce:transition-none",
                        !usesHostOverlay && isHomeSearch && !isSearchOpen && "xl:w-search-overlay-header-inactive-width",
                        !usesHostOverlay && isSearchOpen && "mx-auto max-w-search-overlay-active-width",
                        !usesHostOverlay && !isHomeSearch && !isSearchOpen && "max-w-search-overlay-inline-inactive-width"
                    )}
                >
                    <form
                        role="search"
                        aria-label={ariaLabel}
                        onSubmit={handleSubmit(submitSearch)}
                        className="w-full"
                    >
                        <label
                            className={cn(
                                "flex min-h-12 w-full items-center border border-border-default bg-primary-bg text-xs transition-vympel focus-within:[&_svg]:text-text-primary/90 motion-reduce:transition-none",
                                isSearchOpen
                                    ? "rounded-t-2xl rounded-b-none border-b-0"
                                    : "rounded-full focus-within:border-text-primary",
                                variant === "header"
                                    ? "gap-x-2.5 px-4 py-3"
                                    : coordinatesCatalogOverlay
                                        ? cn(CATALOG_TOOLBAR_CONTROL_HEIGHT_CLASS, "gap-x-4 py-0 pl-5 pr-2")
                                        : "gap-x-4 py-2 pl-5 pr-2",
                                usesMobileIconTrigger && (coordinatesCatalogOverlay
                                    ? "max-[1439px]:min-h-12 max-[1439px]:justify-center max-[1439px]:gap-0 max-[1439px]:px-0 max-[1439px]:py-0"
                                    : "max-lg:min-h-12 max-lg:justify-center max-lg:gap-0 max-lg:px-0 max-lg:py-0")
                            )}
                        >
                            {usesInlineSubmit ? (
                                <>
                                    {mobileIconOnly && usesInlineSubmit ? (
                                         <button
                                             ref={catalogSearchTriggerRef}
                                             type="button"
                                             aria-label={ariaLabel}
                                             aria-expanded={isSearchOpen}
                                             className={cn(
                                                 "inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-text-heading-secondary transition-vympel-fast focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40",
                                                 coordinatesCatalogOverlay ? "min-[1440px]:hidden" : "lg:hidden",
                                                 isSearchOpen && "hidden"
                                             )}
                                            onClick={openMobileIconSearch}
                                        >
                                            <Search className="size-5" aria-hidden="true"/>
                                        </button>
                                    ) : null}
                                    {coordinatesCatalogOverlay && isSearchOpen ? (
                                        <button
                                            type="button"
                                            aria-label={navT("close")}
                                            onClick={closeOverlay}
                                            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-text-product-muted transition-vympel-fast hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40"
                                        >
                                            <X className="size-5" aria-hidden="true"/>
                                        </button>
                                    ) : (
                                        <Search
                                            className={cn(
                                                "size-6 shrink-0 text-text-product-muted transition duration-100",
                                                usesMobileIconTrigger && (coordinatesCatalogOverlay ? "max-[1439px]:hidden" : "max-lg:hidden")
                                            )}
                                            aria-hidden="true"
                                        />
                                    )}
                                </>
                            ) : (
                                <button
                                    type="submit"
                                    aria-label={submitLabel}
                                    className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40"
                                >
                                    <Search className="h-5 w-5 text-text-muted transition duration-100"/>
                                </button>
                            )}

                            <input
                                {...queryField}
                                type="search"
                                onChange={(event) => {
                                    void queryField.onChange(event);
                                    updateQuery(event.target.value);
                                }}
                                onFocus={openOverlay}
                                aria-controls={panelId}
                                placeholder={placeholder}
                                className={cn(
                                    "min-w-0 flex-1 bg-transparent text-text-input-primary outline-none placeholder:text-text-placeholder",
                                    usesInlineSubmit && "text-2xs leading-none placeholder:text-2xs",
                                    usesMobileIconTrigger && (coordinatesCatalogOverlay ? "max-[1439px]:hidden" : "max-lg:hidden")
                                )}
                            />

                            {query ? (
                                <button
                                    type="button"
                                    aria-label={navT("clear")}
                                    onClick={clearSearch}
                                    className={cn(
                                        "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-sm text-text-muted transition hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40",
                                        usesMobileIconTrigger && (coordinatesCatalogOverlay ? "max-[1439px]:hidden" : "max-lg:hidden")
                                    )}
                                >
                                    <X className="h-5 w-5"/>
                                </button>
                            ) : null}

                            {usesInlineSubmit ? (
                                <Button
                                    type="submit"
                                    variant="action"
                                    size="sm"
                                    className={cn(
                                        "h-search-overlay-submit-height w-search-overlay-submit-width shrink-0 px-0 py-0",
                                        usesMobileIconTrigger && (coordinatesCatalogOverlay ? "max-[1439px]:hidden" : "max-lg:hidden")
                                    )}
                                >
                                    <Text as="span" colors="inverse" size="bodyXs" className="leading-none">
                                        {submitLabel}
                                    </Text>
                                </Button>
                            ) : null}
                        </label>
                    </form>

                    <div
                        id={panelId}
                        aria-hidden={!isSearchOpen}
                        className={cn(
                            "absolute left-0 top-full z-50 -mt-px w-full origin-top rounded-b-2xl border border-t-0 border-border-default bg-primary-bg transition-vympel motion-reduce:transition-none",
                            isSearchOpen
                                ? "visible translate-y-0 opacity-100"
                                : "invisible pointer-events-none -translate-y-1 opacity-0 motion-reduce:translate-y-0"
                        )}
                    >
                        <div
                            className={cn(
                                "box-border max-h-search-overlay-panel-max overflow-hidden",
                                canSearch
                                    ? "px-5 py-catalog-filter-panel-padding-y sm:px-catalog-filter-panel-padding-x"
                                    : "px-5 py-4 sm:px-6"
                            )}
                        >
                            <SmartSearchPanelContent
                                canSearch={canSearch}
                                closeOverlay={closeOverlay}
                                currencySymbol={goodT("currencySymbol")}
                                locale={locale}
                                results={results}
                                retryAfterSeconds={retryAfterSeconds}
                                retrySearch={retrySearch}
                                status={status}
                                submitSearch={submitSearch}
                                t={navT}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SmartSearch;

function matchesCompactSearchViewport(variant: SmartSearchVariant) {
    return window.matchMedia(variant === "catalog" ? "(max-width: 1439px)" : "(max-width: 1023px)").matches;
}

type SearchTranslator = ReturnType<typeof useTranslations>;

type RenderPanelContentParams = {
    canSearch: boolean;
    closeOverlay: () => void;
    currencySymbol: string;
    locale: string;
    results: IQuickSearchProduct[];
    retryAfterSeconds: number;
    retrySearch: () => void;
    status: SearchStatus;
    submitSearch: () => void;
    t: SearchTranslator;
};

function SmartSearchPanelContent({
                                     canSearch,
                                     closeOverlay,
                                     currencySymbol,
                                     locale,
                                     results,
                                     retryAfterSeconds,
                                     retrySearch,
                                     status,
                                     submitSearch,
                                     t,
                                 }: RenderPanelContentParams) {
    if (!canSearch) {
        return (
            <Text size="bodySm" colors="muted">
                {t("emptyPrompt")}
            </Text>
        );
    }

    if (status === "idle" || status === "loading") {
        return (
            <div className="space-y-4" aria-live="polite">
                <Text size="bodySm" colors="muted">
                    {t("loading")}
                </Text>
                <div className="space-y-3">
                    {Array.from({length: 3}).map((_, index) => (
                        <div key={index} className="flex gap-4">
                            <div className="skeleton size-search-overlay-result-image shrink-0 rounded-lg"/>
                            <div className="flex min-w-0 flex-1 flex-col gap-2">
                                <div className="skeleton h-4 w-3/4 rounded-sm"/>
                                <div className="skeleton h-3 w-1/2 rounded-sm"/>
                                <div className="skeleton h-4 w-1/3 rounded-sm"/>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (status === "rateLimited") {
        return (
            <div className="space-y-4">
                <div>
                    <Text size="bodySm" weight="medium">{t("rateLimitTitle")}</Text>
                    <Text className="mt-2" size="caption" colors="muted">
                        {t("rateLimitDescription", {seconds: retryAfterSeconds})}
                    </Text>
                </div>
                <Button variant="default" size="sm" onClick={retrySearch} disabled={retryAfterSeconds > 0}>
                    {retryAfterSeconds > 0 ? t("retryIn", {seconds: retryAfterSeconds}) : t("retry")}
                </Button>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="space-y-4">
                <div>
                    <Text size="bodySm" weight="medium">
                        {t("errorTitle")}
                    </Text>
                    <Text className="mt-2" size="caption" colors="muted">
                        {t("errorDescription")}
                    </Text>
                </div>
                <Button variant="default" size="sm" onClick={retrySearch}>
                    {t("retry")}
                </Button>
            </div>
        );
    }

    if (status === "success" && results.length === 0) {
        return (
            <div className="space-y-4">
                <div>
                    <Text size="bodySm" weight="medium">
                        {t("noResultsTitle")}
                    </Text>
                    <Text className="mt-2" size="caption" colors="muted">
                        {t("noResultsDescription")}
                    </Text>
                </div>
                <Button variant="default" size="sm" onClick={submitSearch}>
                    {t("goCatalog")}
                </Button>
            </div>
        );
    }

    return (
        <div className="flex max-h-search-overlay-panel-content min-h-0 flex-col overflow-hidden">
            <ul className="catalog-filter-scroll min-h-0 overflow-y-auto pr-2">
                {results.map((product) => (
                    <SmartSearchProductRow
                        key={product.id}
                        product={product}
                        locale={locale}
                        currencySymbol={currencySymbol}
                        closeOverlay={closeOverlay}
                        t={t}
                    />
                ))}
            </ul>

            <div className="mt-5 flex justify-end border-t border-border-default pt-5">
                <Button variant="action" size="sm" onClick={submitSearch}>
                    {t("showAll")}
                </Button>
            </div>
        </div>
    );
}

type SmartSearchProductRowProps = {
    product: IQuickSearchProduct;
    locale: string;
    currencySymbol: string;
    closeOverlay: () => void;
    t: SearchTranslator;
};

function SmartSearchProductRow({
                                   product,
                                   locale,
                                   currencySymbol,
                                   closeOverlay,
                                   t,
                               }: SmartSearchProductRowProps) {
    const unavailable = isProductUnavailable(product);
    const formattedPrice = formatProductPrice(product.price, locale, currencySymbol);
    const metadata = [
        product.brand?.name,
        product.collection?.name,
        product.model ? t("modelLabel", {model: product.model}) : null,
        product.sku ? t("skuLabel", {sku: product.sku}) : null,
    ].filter(Boolean).join(" | ");

    return (
        <li className="border-b border-border-default last:border-b-0">
            <Link
                href={routes.product(product.id)}
                onClick={closeOverlay}
                aria-label={t("resultAria", {name: product.name, price: formattedPrice})}
                className="group flex gap-4 rounded-sm py-4 transition hover:bg-surface-card focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40"
            >
                <div className="flex size-search-overlay-result-image shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-card">
                    {product.imageUrl ? (
                        <Image
                            src={product.imageUrl}
                            alt={product.name}
                            width={72}
                            height={72}
                            sizes="72px"
                            className={cn(
                                "h-full w-full object-contain transition",
                                unavailable && "opacity-45 saturate-50"
                            )}
                            unoptimized
                        />
                    ) : (
                        <ProductImageFallback compact className="h-full w-full rounded-lg border-0"/>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <Text as="span" size="bodySm" weight="medium" className="block truncate group-hover:text-text-heading-primary">
                        {product.name}
                    </Text>
                    {metadata ? (
                        <Text as="span" size="caption" colors="muted" className="mt-1 block truncate">
                            {metadata}
                        </Text>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <Text as="span" size="bodySm" weight="semibold">
                            <data value={product.price}>{formattedPrice}</data>
                        </Text>
                        {product.oldPrice ? (
                            <Text as="span" size="caption" colors="muted" className="line-through">
                                <data value={product.oldPrice}>
                                    {formatProductPrice(product.oldPrice, locale, currencySymbol)}
                                </data>
                            </Text>
                        ) : null}
                        {unavailable ? (
                            <Text as="span" size="caption" colors="headingSecondary">
                                {t("unavailable")}
                            </Text>
                        ) : null}
                    </div>
                </div>
            </Link>
        </li>
    );
}
