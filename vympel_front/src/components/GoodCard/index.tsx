"use client";

import {FC, useMemo, useState} from "react";
import Image from "next/image";
import {useLocale, useTranslations} from "use-intl";

import Card from "@/components/ui/shared/Card";
import {Text} from "@/components/ui/shared/text";
import {Link} from "@/i18n/navigation";
import {cn} from "@/lib/utils";
import Button, {variants as buttonVariants} from "@/components/ui/shared/Button";
import Basket from "@/assets/icons/Basket";
import ArrowRight from "@/assets/icons/ArrowRight";
import Favorite from "@/assets/icons/Favorite";
import {Heading} from "@/components/ui/shared/text/Heading";
import {IProductFeature} from "@/api/types/ProductTypes";
import {formatProductPrice} from "@/utils/formatProductPrice";
import {trackProductEvent} from "@/components/ProductAnalyticsTracker";
import {
    createProductSnapshot,
    isProductUnavailable,
    useCartProduct,
    useFavoriteProduct
} from "@/services/localProductStorage";
import {routes} from "@/config/routes";
import {useProductActionToasts} from "@/hooks/useProductActionToasts";
import {Star} from "lucide-react";
import ProductImageFallback from "@/components/ui/shared/ProductImageFallback";

export type GoodCardProps = {
    id: number;
    img?: string | null;
    name: string;
    collection?: IProductFeature;
    description?: string;
    price: number;
    stockQuantity?: number | null;
    status?: string | null;
    href?: string;
    link?: string;
    priority?: boolean;
    isCatalog?: boolean;
    className?: string;
    ratingAverage?: number | null;
    ratingCount?: number | null;
};

const GoodCard: FC<GoodCardProps> = ({
                                         img,
                                         id,
                                         price,
                                         collection,
                                         description,
                                         name,
                                         stockQuantity,
                                         status,
                                         href,
                                         link,
                                         priority = false,
                                         isCatalog = true,
                                         className,
                                         ratingAverage,
                                         ratingCount,
                                     }) => {
    const t = useTranslations("good");
    const locale = useLocale();
    const productHref = href ?? link ?? routes.product(id);
    const formattedPrice = formatProductPrice(price, locale, t("currencySymbol"));
    const productSnapshot = useMemo(() => createProductSnapshot({
        id,
        name,
        price,
        imageUrl: img,
        collection,
        description,
        stockQuantity,
        status,
        href: productHref,
    }), [collection, description, id, img, name, price, productHref, status, stockQuantity]);
    const isUnavailable = isProductUnavailable(productSnapshot);
    const {isFavorite, toggleFavorite} = useFavoriteProduct(productSnapshot);
    const {isInCart, addItem} = useCartProduct(productSnapshot);
    const actionToasts = useProductActionToasts();
    const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
    const canRenderImage = Boolean(img) && failedImageUrl !== img;

    const toggleFavoriteHandler = () => {
        const result = toggleFavorite();

        if (!result.ok) {
            actionToasts.favoriteFailed();
            return;
        }

        if (result.status === "added") {
            actionToasts.favoriteAdded();
            trackProductEvent(id, "FAVORITE");
            return;
        }

        if (result.status === "removed") {
            actionToasts.favoriteRemoved(productSnapshot);
            trackProductEvent(id, "UNFAVORITE");
        }
    };

    const addToCartHandler = () => {
        if (isUnavailable) {
            actionToasts.cartOutOfStock();
            return;
        }

        if (isInCart) {
            actionToasts.cartAlreadyInCart();
            return;
        }

        const result = addItem(1, {incrementExisting: false});

        if (!result.ok) {
            if (result.status === "unavailable") {
                actionToasts.cartOutOfStock();
                return;
            }

            if (result.status === "stockLimit") {
                actionToasts.cartStockLimit();
                return;
            }

            actionToasts.cartFailed();
            return;
        }

        if (result.status === "alreadyInCart") {
            actionToasts.cartAlreadyInCart();
            return;
        }

        actionToasts.cartAdded();
        trackProductEvent(id, "ADD_TO_CART");
    };

    return (
        <article
            className={cn(
                "w-full min-w-0",
                className
            )}
        >
            <div>
                <div className="relative">
                    <Link
                        href={productHref}
                        aria-label={t("productLinkAria", {name, price: formattedPrice})}
                        className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40"
                    >
                        <Card className="relative flex aspect-27/37 w-full items-center justify-center overflow-hidden">
                            {canRenderImage ? (
                                <Image
                                    width={270}
                                    height={370}
                                    src={img ?? ""}
                                    alt={name}
                                    sizes="(max-width: 640px) 70vw, (max-width: 1024px) 33vw, 270px"
                                    className={cn(
                                        "h-full w-auto object-contain transition",
                                        isUnavailable && "opacity-45 saturate-50"
                                    )}
                                    priority={priority}
                                    unoptimized
                                    onError={() => setFailedImageUrl(img ?? null)}
                                />
                            ) : (
                                <ProductImageFallback className="h-full w-full rounded-none border-0"/>
                            )}
                            {isUnavailable && (
                                <div className="product-card-badge absolute bottom-2 left-2 rounded-full border border-border-default bg-primary-bg/95 px-2.5 py-1.5 shadow-sm sm:left-4 sm:top-4 sm:bottom-auto sm:px-4 sm:py-2">
                                    <Text as="span" size="caption" colors="headingSecondary" weight="medium" className="block text-center leading-tight">
                                        {t("outOfStock")}
                                    </Text>
                                </div>
                            )}
                        </Card>
                    </Link>
                    <button
                        type="button"
                        aria-label={isFavorite ? t("removeFavorite", {name}) : t("addFavorite", {name})}
                        aria-pressed={isFavorite}
                        onClick={toggleFavoriteHandler}
                        className={cn(
                            "absolute right-3 top-3 flex size-11 items-center justify-center rounded-full border border-border-default bg-primary-bg/95 text-text-heading-secondary transition sm:right-4 sm:top-4 sm:size-10",
                            "focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40",
                            isFavorite && "bg-button-bg-action text-button-text-action [&_path]:fill-current"
                        )}
                    >
                        <Favorite className="size-6"/>
                    </button>
                </div>

                <div className="mt-4">
                    <Link
                        href={productHref}
                        className="block rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40"
                    >
                        <Heading as={isCatalog ? "h2" : "h3"} size="bodyXl" className="product-card-title leading-tight">
                            {name}
                        </Heading>
                    </Link>

                    {(collection?.name || description) && (
                        <Text className="product-card-meta mt-2 leading-snug" size="bodyMd">
                            {collection?.name ? t("collectionWithName", {collection: collection.name}) : description}
                        </Text>
                    )}

                    <div className="mt-2 flex min-h-5 items-center gap-2">
                        <Star
                            aria-hidden="true"
                            className={cn(
                                "size-4",
                                ratingCount ? "fill-current text-text-product-secondary" : "text-border-default"
                            )}
                        />
                        <Text as="span" size="caption" colors={ratingCount ? "secondary" : "muted"}>
                            {ratingCount && ratingAverage != null
                                ? t("ratingSummary", {
                                    average: ratingAverage.toFixed(1),
                                    count: ratingCount,
                                })
                                : t("noRatings")}
                        </Text>
                    </div>

                    <div className="mt-5 flex flex-col items-start justify-between gap-3 sm:mt-6 sm:flex-row sm:items-center">
                        <Text size="h6" className="min-w-0 max-w-full leading-tight">
                            <data value={price}>{formattedPrice}</data>
                        </Text>
                        {
                            isCatalog && (
                                <div className="flex shrink-0 gap-2">
                                    <Link
                                        href={productHref}
                                        aria-label={t("openProduct", {name})}
                                        className={buttonVariants({variant: "default", size: "icon"})}
                                    >
                                        <ArrowRight className="w-6 h-auto text-button-bg-action"/>
                                    </Link>
                                    <Button
                                        aria-label={
                                            isUnavailable
                                                ? t("outOfStock")
                                                : isInCart
                                                    ? t("inCart", {name})
                                                    : t("addToCart", {name})
                                        }
                                        aria-pressed={isInCart}
                                        aria-disabled={isUnavailable}
                                        disabled={isUnavailable}
                                        variant="action"
                                        onClick={addToCartHandler}
                                        className={cn(
                                            "[&_path]:stroke-button-text-action hover:[&_path]:stroke-button-text-action/90",
                                            "[&_path]:transition [&_circle]:transition",
                                            isUnavailable && "cursor-not-allowed hover:bg-button-bg-action/30",
                                            isInCart && "bg-button-bg-product [&_circle]:fill-button-text-action [&_path]:fill-button-text-action [&_path]:stroke-button-text-action"
                                        )}
                                        icon={<Basket className="w-8 h-auto transition"/>}
                                    />
                                </div>
                            )
                        }
                    </div>
                </div>
            </div>
        </article>
    );
};

export default GoodCard;
