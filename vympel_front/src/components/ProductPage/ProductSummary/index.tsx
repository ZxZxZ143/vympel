"use client";

import {useMemo} from "react";
import {Award, BadgeCheck} from "lucide-react";
import {useForm} from "react-hook-form";
import {useLocale, useTranslations} from "use-intl";

import Button from "@/components/ui/shared/Button";
import {Heading} from "@/components/ui/shared/text/Heading";
import {Text} from "@/components/ui/shared/text";
import Favorite from "@/assets/icons/Favorite";
import ArrowRight from "@/assets/icons/ArrowRight";
import {IProductDetails} from "@/api/types/ProductTypes";
import {cn} from "@/lib/utils";
import {formatProductPrice} from "@/utils/formatProductPrice";
import {trackProductEvent} from "@/components/ProductAnalyticsTracker";
import {
    createProductSnapshot,
    isProductUnavailable,
    useCartProduct,
    useFavoriteProduct
} from "@/services/localProductStorage";
import {Link} from "@/i18n/navigation";
import {routes} from "@/config/routes";
import {useProductActionToasts} from "@/hooks/useProductActionToasts";
import RatingStars from "@/components/ProductRating/RatingStars";
import CustomerRequestButton from "@/components/CustomerRequestDialog/CustomerRequestButton";

type Props = {
    product: IProductDetails;
};

type StockNotifyFormValues = {
    email: string;
    phone: string;
};

const ProductSummary = ({product}: Props) => {
    const t = useTranslations("product");
    const locale = useLocale();
    const notifyForm = useForm<StockNotifyFormValues>({
        defaultValues: {
            email: "",
            phone: "",
        },
    });
    const productSnapshot = useMemo(() => createProductSnapshot(product), [product]);
    const {isFavorite, toggleFavorite: toggleStoredFavorite} = useFavoriteProduct(productSnapshot);
    const {isInCart, addItem} = useCartProduct(productSnapshot);
    const actionToasts = useProductActionToasts();
    const gender = product.watchDetails?.gender?.name;
    const isAvailable = !isProductUnavailable(productSnapshot);
    const formattedPrice = formatProductPrice(product.price, locale, t("currencySymbol"));
    const toggleFavoriteHandler = () => {
        const result = toggleStoredFavorite();

        if (!result.ok) {
            actionToasts.favoriteFailed();
            return;
        }

        if (result.status === "added") {
            actionToasts.favoriteAdded();
            trackProductEvent(product.id, "FAVORITE");
            return;
        }

        if (result.status === "removed") {
            actionToasts.favoriteRemoved(productSnapshot);
            trackProductEvent(product.id, "UNFAVORITE");
        }
    };

    const addToCart = () => {
        if (!isAvailable) {
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
        trackProductEvent(product.id, "ADD_TO_CART");
    };

    const submitStockNotify = () => {
        // The storefront does not currently expose a stock-notify endpoint.
    };

    return (
        <section className="flex w-full max-w-none flex-col lg:max-w-[380px] lg:pt-1">
            <div className="mb-10">
                <Heading
                    as="h1"
                    size="productTitle"
                    weight="regular"
                    colors="primary"
                    className="max-w-none leading-product-title lg:max-w-[330px]"
                >
                    {product.name}
                </Heading>
                {gender ? (
                    <Text
                        size="productMeta"
                        colors="productMuted"
                        className="mt-4 leading-6"
                    >
                        {gender}
                    </Text>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                    <RatingStars
                        value={product.ratingAverage ?? 0}
                        ariaLabel={t("reviews.ratingAria", {
                            rating: product.ratingAverage?.toFixed(1) ?? "0",
                        })}
                    />
                    <Text as="span" size="bodySm" colors="muted">
                        {product.ratingCount
                            ? t("reviews.summary", {
                                average: product.ratingAverage?.toFixed(1) ?? "0",
                                count: product.ratingCount,
                            })
                            : t("reviews.noRating")}
                    </Text>
                </div>
            </div>

            {!isAvailable ? (
                <div className="flex flex-col gap-4 mb-6">
                    <Heading
                        as="h2"
                        size="productTitle"
                        weight="regular"
                        colors="primary"
                        className="leading-product-title"
                    >
                        {t("summary.outOfStockTitle")}
                    </Heading>
                    <Text size="bodyMd" className="max-w-none leading-6 lg:max-w-[330px]">
                        {t("summary.outOfStockBody")}
                    </Text>
                </div>
            ) : null}

            <Text size="h5" colors="primary" className="leading-10">
                {formattedPrice}
            </Text>

            {isAvailable ? (
                <>
                    <div className="flex items-center gap-3 mt-7">
                        <Button
                            variant="action"
                            aria-pressed={isInCart}
                            className={cn(
                                "h-[50px] min-w-0 flex-1 whitespace-nowrap border-0 px-0 lg:w-[311px] lg:flex-none",
                                isInCart
                                    ? "bg-button-bg-action hover:bg-button-bg-action/85"
                                    : "bg-button-bg-product hover:bg-button-bg-product/90"
                            )}
                            onClick={addToCart}
                        >
                            <Text as="span" colors="inverse" size="bodyMd" weight="medium" className="leading-none">
                                {isInCart ? t("inCart") : t("addToCart")}
                            </Text>
                        </Button>
                        <button
                            type="button"
                            aria-label={t("favorite")}
                            aria-pressed={isFavorite}
                            onClick={toggleFavoriteHandler}
                            className={cn(
                                "flex size-[50px] shrink-0 items-center justify-center rounded-full border border-border-default transition",
                                isFavorite
                                    ? "bg-button-bg-action text-button-text-action [&_path]:fill-current"
                                    : "bg-button-bg-default text-text-product-secondary hover:bg-button-bg-action/10"
                            )}
                        >
                            <Favorite className="size-8"/>
                        </button>
                    </div>

                    <CustomerRequestButton
                        source={`product_model_question:${product.id}`}
                        title="question"
                        className="my-10 flex w-fit items-center gap-4 text-left"
                    >
                        <Text as="span" size="bodyLg" colors="productSecondary" className="leading-7">
                            {t("summary.askQuestion")}
                        </Text>
                        <ArrowRight className="w-6"/>
                    </CustomerRequestButton>

                    <div className="flex gap-3 sm:gap-5">
                        <Link
                            href={routes.guarantee()}
                            aria-label={t("summary.certificateAria")}
                            className="flex size-14 items-center justify-center rounded-lg bg-product-certificate text-button-text-action sm:size-[74px]"
                        >
                            <Award className="size-8 sm:size-11" aria-hidden="true"/>
                        </Link>
                        <Link
                            href={routes.guarantee()}
                            aria-label={t("summary.warrantyAria")}
                            className="flex size-14 items-center justify-center rounded-lg bg-product-warranty text-button-text-action sm:size-[74px]"
                        >
                            <BadgeCheck className="size-8 sm:size-11" aria-hidden="true"/>
                        </Link>
                    </div>
                </>
            ) : (
                <form className="flex max-w-none flex-col gap-3 mt-4 lg:max-w-[330px]" onSubmit={notifyForm.handleSubmit(submitStockNotify)}>
                    <label className="flex flex-col gap-2">
                        <Text as="span" size="bodySm" weight="medium">{t("summary.emailLabel")}</Text>
                        <input
                            {...notifyForm.register("email")}
                            type="email"
                            placeholder={t("summary.emailPlaceholder")}
                            className="h-10 rounded-full border border-border-default px-5.5 py-4 text-2xs outline-none placeholder:text-text-placeholder focus:border-text-heading-secondary"
                        />
                    </label>
                    <label className="flex flex-col gap-2">
                        <Text as="span" size="bodySm" weight="medium">{t("summary.phoneLabel")}</Text>
                        <input
                            {...notifyForm.register("phone")}
                            type="tel"
                            placeholder={t("summary.phonePlaceholder")}
                            className="h-10 rounded-full border border-border-default px-5.5 py-4 text-2xs outline-none placeholder:text-text-placeholder focus:border-text-heading-secondary"
                        />
                    </label>
                    <Button type="submit" variant="action" className="mt-4 h-12">
                        <Text as="span" colors="inverse" className="leading-none">
                            {t("summary.notifySubmit")}
                        </Text>
                    </Button>
                </form>
            )}
        </section>
    );
};

export default ProductSummary;
