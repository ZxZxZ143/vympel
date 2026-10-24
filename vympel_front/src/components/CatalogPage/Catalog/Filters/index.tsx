"use client";

import {FC, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {X} from "lucide-react";
import {usePathname, useSearchParams} from "next/navigation";
import {Controller, useForm, useWatch} from "react-hook-form";
import {useTranslations} from "use-intl";
import {useProgressRouter} from "@/hooks/useProgressRouter";

import FilterIcon from "@/assets/icons/FilterIcon";
import {PublicApiController} from "@/api/controllers/PublicController";
import {ICatalogFilter, ICatalogFiltersResponse} from "@/api/types/ProductTypes";
import {LocaleEnum} from "@/i18n/routing";
import Checkbox from "@/components/ui/shared/Form/Checkbox";
import {Text} from "@/components/ui/shared/text";
import {cn} from "@/lib/utils";
import {
    CATALOG_CONTROL_PARAM_SET,
    REMOVED_CATALOG_FILTER_PARAM_SET,
    normalizeCatalogQueryValue,
    normalizeCatalogQueryValues
} from "@/utils/catalogFilterParams";
import CatalogMobileSheet, {useIsMobileViewport} from "@/components/CatalogPage/CatalogMobileSheet";
import {useCatalogOverlay} from "@/components/CatalogPage/CatalogOverlayProvider";
import {CATALOG_TOOLBAR_CONTROL_HEIGHT_CLASS} from "@/components/CatalogPage/CatalogOverlayProvider/state";

type Props = {
    locale: LocaleEnum;
    categoryCode?: string;
};

import {catalogFacetParams, readCatalogFilterDraft, type CatalogFilterFormValues} from "@/utils/catalogFacetDraft";

const CatalogFilters: FC<Props> = ({locale, categoryCode}) => {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const t = useTranslations("catalog.filters");
    const router = useProgressRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const {activeOverlay, closeOverlay, openOverlay} = useCatalogOverlay();
    const isMobileViewport = useIsMobileViewport();
    const [snapshot, setSnapshot] = useState<{scope: string; selection: string; data: ICatalogFiltersResponse} | null>(null);
    const scope = `${locale}:${categoryCode ?? ""}`;
    const metadata = snapshot?.scope === scope ? snapshot.data : null;
    const [updating, setUpdating] = useState(true);
    const loading = updating && !metadata;
    const [error, setError] = useState(false);
    const [activeKey, setActiveKey] = useState<string | null>(null);
    const queryString = searchParams?.toString() ?? "";
    const {control, handleSubmit, reset} = useForm<CatalogFilterFormValues>({
        defaultValues: readCatalogFilterDraft(new URLSearchParams(queryString)),
    });
    const watched = useWatch({control});
    const selection = catalogFacetParams({filters: watched.filters as Record<string, string[]> ?? {},
        priceMin: watched.priceMin ?? "", priceMax: watched.priceMax ?? ""}, searchParams?.get("search") ?? null).toString();
    const countsReady = !updating && !error && snapshot?.scope === scope && snapshot.selection === selection;

    const filters = useMemo(() => metadata?.filters ?? [], [metadata]);
    const filterKeySignature = filters.map((filter) => filter.key).join(",");
    const filterKeys = useMemo(() => new Set(filterKeySignature.split(",").filter(Boolean)), [filterKeySignature]);
    const activeFilter = filters.find((filter) => filter.key === activeKey) ?? filters[0];
    const isVisible = activeOverlay === "filters";
    const isMobileVisible = isVisible;

    useEffect(() => {
        let cancelled = false;
        const controller = new AbortController();
        // Debounce the draft, not Apply: changing tabs must show counts for all current choices.
        const timer = window.setTimeout(async () => {
            setUpdating(true);
            setError(false);
            try {
                const response = await PublicApiController.getCatalogFilters(locale, categoryCode, new URLSearchParams(selection), controller.signal);
                if (cancelled) return;
                if (!response) throw new Error("Catalog filters unavailable");
                setSnapshot({scope, selection, data: response});
                setActiveKey(current => response.filters.some(filter => filter.key === current) ? current : response.filters[0]?.key ?? null);
            } catch {
                if (!cancelled) setError(true);
            } finally {
                if (!cancelled) setUpdating(false);
            }
        }, 200);
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [locale, categoryCode, scope, selection]);

    useEffect(() => {
        let cancelled = false;
        queueMicrotask(() => {
            if (!cancelled) reset(readCatalogFilterDraft(new URLSearchParams(queryString)));
        });
        return () => { cancelled = true; };
    }, [queryString, reset]);

    useEffect(() => {
        if (!metadata) return;

        const params = new URLSearchParams(searchParams?.toString());
        let changed = false;

        Array.from(new Set(Array.from(params.keys()))).forEach((key) => {
            if (CATALOG_CONTROL_PARAM_SET.has(key)) return;

            const filterKey = normalizeCatalogQueryValue(key);
            const values = normalizeCatalogQueryValues(params.getAll(key));

            if (
                !filterKey
                || REMOVED_CATALOG_FILTER_PARAM_SET.has(filterKey)
                || !filterKeys.has(filterKey)
                || values.length === 0
            ) {
                params.delete(key);
                changed = true;
                return;
            }

            if (filterKey !== key || !hasSameValues(params.getAll(key), values)) {
                params.delete(key);
                values.forEach((value) => params.append(filterKey, value));
                changed = true;
            }
        });

        if (changed) {
            const query = params.toString();
            router.replace(query ? `${pathname}?${query}` : pathname ?? "", {scroll: false});
        }
    }, [filterKeys, metadata, pathname, router, searchParams]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                window.matchMedia("(min-width: 1024px)").matches
                && !rootRef.current?.contains(event.target as Node)
            ) {
                closeOverlay("filters");
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [closeOverlay]);

    const clearKnownFilters = useCallback((params: URLSearchParams) => {
        filters.forEach((filter) => params.delete(filter.key));
        params.delete("priceMin");
        params.delete("priceMax");
        params.delete("minPrice");
        params.delete("maxPrice");
        params.delete("size");
    }, [filters]);

    const applyFilters = (values: CatalogFilterFormValues) => {
        const params = new URLSearchParams(searchParams?.toString());
        clearKnownFilters(params);
        params.set("page", "1");

        Object.entries(values.filters ?? {}).forEach(([key, selectedFilterValues]) => {
            const filterKey = normalizeCatalogQueryValue(key);
            const selectedValues = normalizeCatalogQueryValues(selectedFilterValues);

            if (!filterKey || selectedValues.length === 0) {
                return;
            }

            selectedValues.forEach((value) => params.append(filterKey, value));
        });

        const nextPriceMin = normalizeCatalogQueryValue(values.priceMin);
        const nextPriceMax = normalizeCatalogQueryValue(values.priceMax);

        if (nextPriceMin) {
            params.set("priceMin", nextPriceMin);
        }

        if (nextPriceMax) {
            params.set("priceMax", nextPriceMax);
        }

        closeOverlay("filters");
        router.push(`${pathname}?${params.toString()}`, {scroll: false});
    };

    const resetFilters = () => {
        const params = new URLSearchParams(searchParams?.toString());
        clearKnownFilters(params);
        params.set("page", "1");

        reset({
            filters: {},
            priceMin: "",
            priceMax: "",
        });
        closeOverlay("filters");

        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname ?? "", {scroll: false});
    };

    const renderActiveFilter = (filter: ICatalogFilter | undefined) => {
        if (!filter) {
            return null;
        }

        if (filter.type === "range") {
            return (
                <div className="flex flex-col gap-catalog-filter-option-x-gap gap-y-catalog-filter-option-y-gap sm:flex-row sm:flex-wrap">
                    <Controller
                        control={control}
                        name="priceMin"
                        render={({field}) => (
                            <input
                                {...field}
                                type="number"
                                inputMode="numeric"
                                className="catalog-filter-price-input w-full sm:w-40"
                                min={0}
                                placeholder={t("priceMin")}
                            />
                        )}
                    />
                    <Controller
                        control={control}
                        name="priceMax"
                        render={({field}) => (
                            <input
                                {...field}
                                type="number"
                                inputMode="numeric"
                                className="catalog-filter-price-input w-full sm:w-40"
                                min={0}
                                placeholder={t("priceMax")}
                            />
                        )}
                    />
                </div>
            );
        }

        if (filter.options.length === 0) {
            return <div className="grid grid-cols-1 gap-y-catalog-filter-option-y-gap">
                {filter.key === "stoneInlay" && <Checkbox label="Swarovski" checked={false} disabled onCheckedChange={() => {}}/>}
                <Text size="bodySm" className="text-catalog-filter-disabled">{t("noOptions")}</Text>
            </div>;
        }

        return (
            <div className="grid grid-cols-1 gap-x-catalog-filter-option-x-gap gap-y-catalog-filter-option-y-gap sm:grid-cols-2 lg:grid-cols-3">
                {filter.options.map((option) => (
                    <Controller
                        key={option.value}
                        control={control}
                        name="filters"
                        render={({field}) => {
                            const formFilters = field.value ?? {};
                            const normalizedValue = normalizeCatalogQueryValue(option.value);
                            const selectedValues = normalizeCatalogQueryValues(formFilters[filter.key] ?? []);

                            return (
                                <Checkbox
                                    label={option.label}
                                    count={countsReady ? option.count : undefined}
                                    checked={normalizedValue ? selectedValues.includes(normalizedValue) : false}
                                    disabled={countsReady && option.disabled && !selectedValues.includes(normalizedValue ?? "")}
                                    onCheckedChange={(checked) => {
                                        if (!normalizedValue) {
                                            return;
                                        }

                                        const nextValues = checked
                                            ? Array.from(new Set([...selectedValues, normalizedValue]))
                                            : selectedValues.filter((currentValue) => currentValue !== normalizedValue);
                                        const nextFilters = {...formFilters};

                                        if (nextValues.length > 0) {
                                            nextFilters[filter.key] = nextValues;
                                        } else {
                                            delete nextFilters[filter.key];
                                        }

                                        field.onChange(nextFilters);
                                    }}
                                />
                            );
                        }}
                    />
                ))}
            </div>
        );
    };

    const filterMenu = (mobile: boolean) => (
        <div className={cn(
            "catalog-filter-scroll flex min-h-0 shrink-0",
            mobile
                ? "gap-2 overflow-x-auto border-b border-border-default px-5 py-3"
                : "w-catalog-filter-sidebar-width flex-none flex-col gap-catalog-filter-category-gap overflow-y-auto overflow-x-visible border-r border-border-default pr-10"
        )}>
            {filters.map((filter) => (
                <button
                    key={filter.key}
                    type="button"
                    data-active={activeFilter?.key === filter.key ? "true" : undefined}
                    className={cn(
                        "catalog-hover-trigger min-h-10 shrink-0 rounded-full text-left text-sm text-catalog-filter-category transition-vympel-fast hover:text-text-heading-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/30 motion-reduce:transition-none",
                        mobile ? "border border-border-default px-3" : "w-full border-0 px-0",
                        activeFilter?.key === filter.key && (mobile ? "bg-surface-card font-semibold" : "font-semibold")
                    )}
                    onClick={() => setActiveKey(filter.key)}
                >
                    <span
                        className="catalog-hover-label catalog-filter-menu-label product-long-copy block"
                        data-active={activeFilter?.key === filter.key ? "true" : undefined}
                    >
                        {filter.label}
                    </span>
                </button>
            ))}
        </div>
    );

    return (
        <div ref={rootRef} className="lg:static">
            <button
                type="button"
                aria-expanded={isMobileVisible}
                aria-haspopup="dialog"
                aria-label={t("trigger")}
                className="flex size-12 min-h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-border-default px-0 py-0 transition-vympel-fast focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40 min-[1440px]:hidden"
                onClick={(event) => {
                    if (isMobileVisible) {
                        closeOverlay("filters");
                    } else {
                        openOverlay("filters", event.currentTarget);
                    }
                }}
            >
                <FilterIcon className="size-5"/>
            </button>

            <button
                type="button"
                aria-expanded={isVisible}
                aria-label={t("trigger")}
                className={cn(
                    "hidden w-fit cursor-pointer items-center justify-start gap-catalog-filter-trigger-gap border-0 px-0 py-0 transition-vympel-fast focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40 min-[1440px]:flex",
                    CATALOG_TOOLBAR_CONTROL_HEIGHT_CLASS
                )}
                onClick={(event) => {
                    if (isVisible) {
                        closeOverlay("filters");
                    } else {
                        openOverlay("filters", event.currentTarget);
                    }
                }}
            >
                <FilterIcon className="size-8"/>
                <Text as="span" size="bodyXl" colors="headingSecondary" className="min-w-0 text-center leading-tight">
                    {t("trigger")}
                </Text>
            </button>

            <CatalogMobileSheet
                open={isMobileVisible}
                title={t("trigger")}
                onOpenChange={(open) => {
                    if (!open) closeOverlay("filters");
                }}
            >
                <header className="flex min-h-16 items-center justify-between gap-4 border-b border-border-default px-5">
                    <Text as="h2" size="bodyLg" weight="medium" colors="headingPrimary">
                        {t("trigger")}
                    </Text>
                    <button
                        type="button"
                        aria-label={t("close")}
                        className="inline-flex size-11 items-center justify-center rounded-full transition-vympel-fast focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40"
                        onClick={() => closeOverlay("filters")}
                    >
                        <X className="size-5" aria-hidden="true"/>
                    </button>
                </header>

                {loading ? <Text size="bodySm" className="px-5 py-6">{t("loading")}</Text> : null}
                {error ? <Text size="bodySm" className="px-5 py-6 text-error">{t("error")}</Text> : null}

                {!loading && metadata ? (
                    <form className="flex min-h-0 flex-1 flex-col overflow-hidden" onSubmit={handleSubmit(applyFilters)}>
                        {filterMenu(true)}
                        <div className="catalog-filter-scroll min-h-0 min-w-0 flex-1 overflow-y-auto px-5 py-5">
                            {renderActiveFilter(activeFilter)}
                        </div>
                        <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-border-default bg-primary-bg px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
                            <button
                                type="button"
                                className="min-h-12 rounded-full border border-catalog-filter-input-border px-4 text-sm text-catalog-filter-option transition-vympel-fast focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/30"
                                onClick={resetFilters}
                            >
                                {t("reset")}
                            </button>
                            <button
                                type="submit"
                                className="min-h-12 rounded-full bg-button-bg-action px-4 text-sm text-button-text-action transition-vympel-fast focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/30"
                            >
                                {t("apply")}
                            </button>
                        </div>
                    </form>
                ) : null}
            </CatalogMobileSheet>

            <div
                aria-hidden={!isVisible}
                className={cn(
                    "catalog-toolbar-panel catalog-toolbar-panel-wide absolute top-full z-30 hidden max-h-none w-full origin-top rounded-bl-2xl rounded-br-2xl border bg-primary-bg transition-vympel motion-reduce:transition-none lg:block",
                    !isVisible && "pointer-events-none invisible -translate-y-1 opacity-0 motion-reduce:translate-y-0",
                    isVisible && "visible translate-y-0 opacity-100"
                )}
            >
                <div className="box-border max-h-catalog-filter-panel-max overflow-hidden px-catalog-filter-panel-padding-x py-catalog-filter-panel-padding-y">
                    {loading && <Text size="bodySm">{t("loading")}</Text>}
                    {error && <Text size="bodySm" className="text-error">{t("error")}</Text>}

                    {!loading && metadata && !isMobileViewport ? (
                        <form
                            className="flex max-h-catalog-filter-panel-content min-h-0 gap-catalog-filter-sidebar-options-gap overflow-hidden"
                            onSubmit={handleSubmit(applyFilters)}
                        >
                            {filterMenu(false)}
                            <div className="catalog-filter-scroll min-h-0 min-w-0 flex-1 overflow-y-auto">
                                {renderActiveFilter(activeFilter)}
                                <div className="mt-10 flex flex-wrap gap-5">
                                    <button
                                        type="submit"
                                        className="min-h-11 border border-catalog-filter-input-border px-8 py-3 text-xs text-catalog-filter-option transition-vympel-fast hover:bg-surface-card focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/30"
                                    >
                                        {t("apply")}
                                    </button>
                                    <button
                                        type="button"
                                        className="min-h-11 px-8 py-3 text-xs text-catalog-filter-disabled transition-vympel-fast hover:text-catalog-filter-option focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/30"
                                        onClick={resetFilters}
                                    >
                                        {t("reset")}
                                    </button>
                                </div>
                            </div>
                        </form>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default CatalogFilters;

function hasSameValues(currentValues: string[], normalizedValues: string[]): boolean {
    return currentValues.length === normalizedValues.length
        && currentValues.every((value, index) => value === normalizedValues[index]);
}
