"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {useTranslations} from "use-intl";

import {LocaleEnum} from "@/i18n/routing";
import {PublicApiController} from "@/api/controllers/PublicController";
import {IProduct} from "@/api/types/ProductTypes";
import {ProductSortEnum} from "@/enums/SortEnum";
import GoodCard from "@/components/GoodCard";
import GoodsCarouselWithImage from "@/components/ui/shared/GoodsCarouselWithImage";
import SectionWithTitle from "@/components/ui/shared/SectionWithTitle";
import {Heading} from "@/components/ui/shared/text/Heading";
import {Text} from "@/components/ui/shared/text";
import Navigation from "@/components/ui/layout/Navigation";
import EmptyState from "@/components/ui/shared/EmptyState";
import ErrorState from "@/components/ui/shared/ErrorState";
import {
    createProductSnapshotFromBatchSummary,
    markProductSnapshotUnavailable,
    ProductSnapshot,
    useFavorites
} from "@/services/localProductStorage";
import {routes} from "@/config/routes";

type Props = {
    locale: LocaleEnum;
};

const FavoritesPage = ({locale}: Props) => {
    const t = useTranslations("favorites");
    const stateT = useTranslations("states");
    const {items, updateFavoriteSnapshot} = useFavorites();
    const itemsRef = useRef(items);
    const [similarProducts, setSimilarProducts] = useState<IProduct[]>([]);
    const [similarLoading, setSimilarLoading] = useState(false);
    const [similarError, setSimilarError] = useState(false);
    const [similarRetryKey, setSimilarRetryKey] = useState(0);
    const [favoritesRefreshing, setFavoritesRefreshing] = useState(false);
    const [favoritesRefreshError, setFavoritesRefreshError] = useState(false);
    const [favoritesRefreshKey, setFavoritesRefreshKey] = useState(0);

    const favoriteIds = useMemo(() => (
        Array.from(new Set(items.map((item) => item.productId))).sort((a, b) => a - b)
    ), [items]);
    const favoriteIdKey = useMemo(() => favoriteIds.join(","), [favoriteIds]);
    const favoriteSnapshots = useMemo(
        () => items.map((item) => item.snapshot).filter(Boolean) as ProductSnapshot[],
        [items]
    );
    const firstFavoriteCategory = useMemo(
        () => favoriteSnapshots.find((snapshot) => snapshot.categoryCode)?.categoryCode,
        [favoriteSnapshots]
    );

    useEffect(() => {
        itemsRef.current = items;
    }, [items]);

    useEffect(() => {
        if (!favoriteIdKey) {
            return;
        }

        let cancelled = false;
        const ids = favoriteIdKey.split(",").map(Number).filter(Boolean);

        const refreshFavorites = async () => {
            setFavoritesRefreshing(true);
            setFavoritesRefreshError(false);

            try {
                const response = await PublicApiController.getProductBatchSummary(ids, locale);
                if (!cancelled) {
                    response.items.forEach((product) => (
                        updateFavoriteSnapshot(createProductSnapshotFromBatchSummary(product))
                    ));
                    const byId = new Map(itemsRef.current.map((item) => [item.productId, item.snapshot]));
                    response.missingIds.forEach((productId) => {
                        const snapshot = byId.get(productId);
                        if (snapshot) {
                            updateFavoriteSnapshot(markProductSnapshotUnavailable(snapshot));
                        }
                    });
                }
            } catch {
                if (!cancelled) setFavoritesRefreshError(true);
            } finally {
                if (!cancelled) {
                    setFavoritesRefreshing(false);
                }
            }
        };

        void refreshFavorites();

        return () => {
            cancelled = true;
        };
    }, [favoriteIdKey, favoritesRefreshKey, locale, updateFavoriteSnapshot]);

    useEffect(() => {
        let cancelled = false;
        const excludedIds = new Set(favoriteIdKey.split(",").map(Number).filter(Boolean));

        const loadSimilar = async () => {
            setSimilarLoading(true);
            setSimilarError(false);

            try {
                const response = await PublicApiController.getCatalogProducts({
                    lang: locale,
                    categoryCode: firstFavoriteCategory ?? undefined,
                    page: 0,
                    size: 12,
                    sort: ProductSortEnum.NEWEST,
                });

                let products = response.content.filter((product) => !excludedIds.has(product.id));

                if (!products.length && firstFavoriteCategory) {
                    const fallback = await PublicApiController.getCatalogProducts({
                        lang: locale,
                        page: 0,
                        size: 12,
                        sort: ProductSortEnum.NEWEST,
                    });
                    products = fallback.content.filter((product) => !excludedIds.has(product.id));
                }

                if (!cancelled) {
                    setSimilarProducts(products);
                }
            } catch {
                if (!cancelled) {
                    setSimilarProducts([]);
                    setSimilarError(true);
                }
            } finally {
                if (!cancelled) {
                    setSimilarLoading(false);
                }
            }
        };

        void loadSimilar();

        return () => {
            cancelled = true;
        };
    }, [favoriteIdKey, firstFavoriteCategory, locale, similarRetryKey]);

    return (
        <main className="mx-auto max-w-360">
            <Navigation/>
            <div className="responsive-page-x pt-10 sm:pt-10">

                <section>
                    <Heading as="h1" size="h2" font="mono" colors="headingPrimary">
                        {t("title")}
                    </Heading>

                    {items.length && favoritesRefreshError ? (
                        <ErrorState
                            compact
                            title={stateT("favorites.loadErrorTitle")}
                            description={stateT("favorites.loadErrorDescription")}
                            retryLabel={stateT("actions.retry")}
                            onRetry={() => setFavoritesRefreshKey((key) => key + 1)}
                            className="mt-10"
                        />
                    ) : null}

                    {favoriteSnapshots.length ? (
                        <div className="brand-product-grid favorites-product-grid mt-10 sm:mt-14">
                            {favoriteSnapshots.map((product, index) => (
                                <GoodCard
                                    key={product.id}
                                    id={product.id}
                                    img={product.imageUrl}
                                    name={product.name}
                                    collection={product.collection ?? undefined}
                                    description={product.description ?? undefined}
                                    price={product.price}
                                    stockQuantity={product.stockQuantity}
                                    status={product.status}
                                    ratingAverage={product.ratingAverage}
                                    ratingCount={product.ratingCount}
                                    href={product.href}
                                    priority={index < 4}
                                    isCatalog
                                />
                            ))}
                        </div>
                    ) : favoritesRefreshing && items.length ? (
                        <Text size="bodyLg" colors="muted" className="mt-12">
                            {t("loading")}
                        </Text>
                    ) : items.length && favoritesRefreshError ? null : (
                        <EmptyState
                            visual="favorites"
                            title={stateT("favorites.emptyTitle")}
                            description={stateT("favorites.emptyDescription")}
                            action={{
                                label: stateT("actions.goCatalog"),
                                href: routes.catalog({page: 1}),
                            }}
                            className="mt-12"
                        />
                    )}

                    <SectionWithTitle title={t("similarTitle")} className="mt-favorites-section-gap">
                        {similarProducts.length ? (
                            <GoodsCarouselWithImage
                                items={similarProducts.map((product) => ({
                                    ...product,
                                    link: routes.product(product.id),
                                }))}
                                showBanner={false}
                                showProductActions
                                className="mt-6"
                            />
                        ) : similarLoading ? (
                            <GoodsCarouselWithImage
                                items={undefined}
                                showBanner={false}
                                className="mt-6"
                            />
                        ) : similarError ? (
                            <ErrorState
                                compact
                                title={stateT("similar.errorTitle")}
                                description={stateT("similar.errorDescription")}
                                retryLabel={stateT("actions.retry")}
                                onRetry={() => setSimilarRetryKey((key) => key + 1)}
                                className="mt-6"
                            />
                        ) : (
                            <EmptyState
                                compact
                                visual="similar"
                                title={stateT("similar.emptyTitle")}
                                description={stateT("similar.emptyDescription")}
                                className="mt-6"
                            />
                        )}
                    </SectionWithTitle>
                </section>
            </div>
        </main>
    );
};

export default FavoritesPage;
