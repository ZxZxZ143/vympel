'use client'

import {FC, useCallback, useMemo, useState} from "react";
import {useSearchParams} from "next/navigation";
import {useTranslations} from "use-intl";

import {LocaleEnum} from "@/i18n/routing";
import {IProduct, IProductListParams} from "@/api/types/ProductTypes";
import {useFetch} from "@/hooks/useFetch";
import {ApiError} from "@/api/types/ApiError";
import {usePagination} from "@/hooks/usePagination";
import {PublicApiController} from "@/api/controllers/PublicController";
import {Page} from "@/api/types/PageType";
import {ProductSortEnum} from "@/enums/SortEnum";
import GoodCard from "@/components/GoodCard";
import GoodCardSkeleton from "@/components/GoodCard/Skeleton";
import Pagination from "@/components/ui/shared/Pagination";
import {useSort} from "@/hooks/useSort";
import {SortValue} from "@/components/CatalogPage/Catalog/Sort/type";
import {
    CATALOG_CONTROL_PARAM_SET,
    REMOVED_CATALOG_FILTER_PARAM_SET,
    normalizeCatalogQueryValue,
    normalizeCatalogQueryValues
} from "@/utils/catalogFilterParams";
import {routes, SEEDED_FILTER_VALUES} from "@/config/routes";
import EmptyState from "@/components/ui/shared/EmptyState";
import ErrorState from "@/components/ui/shared/ErrorState";
import {isAccessoryCategoryCode} from "@/utils/catalogCategories";

type Props = {
    locale: LocaleEnum;
    categoryCode: string | undefined;
}

const Catalog: FC<Props> = ({locale, categoryCode}) => {
    const stateT = useTranslations("states");
    const searchParams = useSearchParams();
    const [goods, setGoods] = useState<Page<IProduct> | null>(null);
    const [retryKey, setRetryKey] = useState(0);
    const {
        page,
        size,
    } = usePagination()
    const {sort} = useSort<SortValue>({
        defaultSort: "priceAsc"
    })
    const isAccessories = isAccessoryCategoryCode(categoryCode);

    const requestParams = useMemo<IProductListParams>(() => ({
        page: page - 1,
        size,
        categoryCode,
        lang: locale,
        sort: sort as ProductSortEnum,
        search: normalizeCatalogQueryValue(searchParams?.get("search")) ?? undefined,
        priceMin: isAccessories ? undefined : normalizeCatalogQueryValue(searchParams?.get("priceMin") ?? searchParams?.get("minPrice")) ?? undefined,
        priceMax: isAccessories ? undefined : normalizeCatalogQueryValue(searchParams?.get("priceMax") ?? searchParams?.get("maxPrice")) ?? undefined,
        filters: isAccessories ? parseAccessoryGenderFilter(searchParams) : parseCatalogFilters(searchParams),
    }), [page, size, categoryCode, locale, sort, searchParams, isAccessories])

    const fetchGoods = useCallback(() => {
        void retryKey;
        return PublicApiController.getCatalogProducts(requestParams);
    }, [requestParams, retryKey])

    const setGoodsHandler = useCallback((data: Page<IProduct>) => {
        setGoods(data)
    }, [])

    const {loading, error} = useFetch<Page<IProduct>, ApiError>(
        fetchGoods,
        setGoodsHandler
    )

    const retryCatalog = useCallback(() => {
        setGoods(null);
        setRetryKey((key) => key + 1);
    }, []);

    const renderGoods = () => {
        if (loading) {
            return new Array(9).fill(0).map((_, index) => (
                <GoodCardSkeleton key={index} isCatalog />
            ))
        }

        return (
            goods?.content.map((good, index) => (
                <GoodCard
                    key={good.id}
                    id={good.id}
                    img={good.imageUrl}
                    name={good.name}
                    collection={good.collection}
                    price={good.price}
                    stockQuantity={good.stockQuantity}
                    status={good.status}
                    ratingAverage={good.ratingAverage}
                    ratingCount={good.ratingCount}
                    href={routes.product(good.id)}
                    priority={index < 3}
                    isCatalog
                />
            ))
        )
    }

    if (error) {
        return (
            <ErrorState
                title={stateT("catalog.errorTitle")}
                description={stateT("catalog.errorDescription")}
                retryLabel={stateT("actions.retry")}
                onRetry={retryCatalog}
                action={{
                    label: stateT("actions.goCatalog"),
                    href: routes.catalog({page: 1}),
                }}
                className="mt-11"
            />
        );
    }

    if (!loading && goods && goods.content.length === 0) {
        return (
            <EmptyState
                visual="catalog"
                title={stateT("catalog.emptyTitle")}
                description={stateT("catalog.emptyDescription")}
                action={{
                    label: stateT("actions.resetFilters"),
                    href: routes.catalog({page: 1}),
                }}
                className="mt-11"
            />
        );
    }

    return (
        <>
            <div id="catalog-product-list" data-pagination-scroll-target="catalog" className="responsive-product-grid mt-11 scroll-mt-28">
                {renderGoods()}
            </div>

            {goods && <Pagination pageData={goods} />}
        </>
    );
};

export default Catalog;

function parseCatalogFilters(searchParams: ReturnType<typeof useSearchParams>): Record<string, string[]> {
    const filters: Record<string, string[]> = {};

    searchParams?.forEach((value, key) => {
        if (CATALOG_CONTROL_PARAM_SET.has(key)) return;

        const filterKey = normalizeCatalogQueryValue(key);
        const values = normalizeCatalogQueryValues([value]);

        if (filterKey && REMOVED_CATALOG_FILTER_PARAM_SET.has(filterKey)) return;
        if (!filterKey || values.length === 0) return;

        filters[filterKey] = Array.from(new Set([
            ...(filters[filterKey] ?? []),
            ...values,
        ]));
    });

    return filters;
}

function parseAccessoryGenderFilter(searchParams: ReturnType<typeof useSearchParams>): Record<string, string[]> {
    const validGenderValues = new Set<string>([
        SEEDED_FILTER_VALUES.gender.women,
        SEEDED_FILTER_VALUES.gender.men,
    ]);
    const genderValue = normalizeCatalogQueryValues(searchParams?.getAll("gender") ?? [])
        .find((value) => validGenderValues.has(value));

    return genderValue ? {gender: [genderValue]} : {};
}
