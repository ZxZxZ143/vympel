'use client'

import {FC, useCallback, useMemo, useState} from "react";
import {useSearchParams} from "next/navigation";
import {useTranslations} from "use-intl";

import {LocaleEnum} from "@/i18n/routing";
import {IProduct, IProductListParams} from "@/api/types/ProductTypes";
import {useFetch} from "@/hooks/useFetch";
import {ApiError} from "@/api/types/ApiError";
import {PublicApiController} from "@/api/controllers/PublicController";
import {Page} from "@/api/types/PageType";
import GoodCard from "@/components/GoodCard";
import GoodCardSkeleton from "@/components/GoodCard/Skeleton";
import Pagination from "@/components/ui/shared/Pagination";
import {catalogRequestParams} from "@/lib/catalogQuery";
import {routes} from "@/config/routes";
import EmptyState from "@/components/ui/shared/EmptyState";
import ErrorState from "@/components/ui/shared/ErrorState";

type Props = {
    locale: LocaleEnum;
    categoryCode: string | undefined;
    initialPage: Page<IProduct> | null;
    initialLoadError: boolean;
}

const Catalog: FC<Props> = ({locale, categoryCode, initialPage, initialLoadError}) => {
    const stateT = useTranslations("states");
    const catalogT = useTranslations("catalog");
    const searchParams = useSearchParams();
    const [goods, setGoods] = useState<Page<IProduct> | null>(initialPage);
    const [serverError, setServerError] = useState(initialLoadError);
    const [retryKey, setRetryKey] = useState(0);
    const requestParams = useMemo<IProductListParams>(() => catalogRequestParams(
        locale, categoryCode, new URLSearchParams(searchParams?.toString()),
    ), [locale, categoryCode, searchParams]);

    const fetchGoods = useCallback(() => {
        void retryKey;
        return PublicApiController.getCatalogProducts(requestParams);
    }, [requestParams, retryKey])

    const setGoodsHandler = useCallback((data: Page<IProduct>) => {
        setGoods(data)
    }, [])

    const {loading, error} = useFetch<Page<IProduct>, ApiError>(
        fetchGoods,
        setGoodsHandler,
        {enabled: retryKey > 0},
    )

    const retryCatalog = useCallback(() => {
        setGoods(null);
        setServerError(false);
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
                    discountPercent={good.discountPercent}
                    finalPrice={good.finalPrice}
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

    if (serverError || error) {
        return (
            <div role="alert">
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
            </div>
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
            <p className="sr-only" role="status" aria-live="polite">
                {loading ? catalogT("loading") : goods ? catalogT("resultCount", {count: goods.totalElements}) : ""}
            </p>
            <div
                id="catalog-product-list"
                data-pagination-scroll-target="catalog"
                aria-busy={loading}
                className="responsive-product-grid mt-11 scroll-mt-28"
            >
                {renderGoods()}
            </div>

            {goods && <Pagination pageData={goods} scrollTargetId="catalog-product-list" />}
        </>
    );
};

export default Catalog;
