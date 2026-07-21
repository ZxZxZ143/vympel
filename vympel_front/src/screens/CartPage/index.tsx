"use client";

import Image from "next/image";
import {Minus, Plus, Trash2} from "lucide-react";
import {useEffect, useMemo, useRef, useState} from "react";
import {useLocale, useTranslations} from "use-intl";

import {LocaleEnum} from "@/i18n/routing";
import {PublicApiController} from "@/api/controllers/PublicController";
import {Link} from "@/i18n/navigation";
import Button from "@/components/ui/shared/Button";
import {Heading} from "@/components/ui/shared/text/Heading";
import {Text} from "@/components/ui/shared/text";
import {formatProductPrice} from "@/utils/formatProductPrice";
import {trackProductEvent} from "@/components/ProductAnalyticsTracker";
import {
    canIncreaseCartItem,
    createProductSnapshotFromBatchSummary,
    getAvailableStock,
    isStockLimitReached,
    isProductUnavailable,
    markProductSnapshotUnavailable,
    ProductSnapshot,
    useCart
} from "@/services/localProductStorage";
import {CONTACT_LINKS, routes} from "@/config/routes";
import EmptyState from "@/components/ui/shared/EmptyState";
import ErrorState from "@/components/ui/shared/ErrorState";
import ProductImageFallback from "@/components/ui/shared/ProductImageFallback";
import {useProductActionToasts} from "@/hooks/useProductActionToasts";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {
    buildWhatsAppOrderMessage,
    buildWhatsAppOrderUrl,
    getCartCheckoutIssue
} from "@/utils/cartCheckout";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Props = {
    locale: LocaleEnum;
};

const CartPage = ({locale}: Props) => {
    const cartT = useTranslations("cart");
    const goodT = useTranslations("good");
    const stateT = useTranslations("states");
    const activeLocale = useLocale();
    const actionToasts = useProductActionToasts();
    const {items, addItem, decrementItem, removeItem, clearCart, updateItemSnapshot} = useCart();
    const itemsRef = useRef(items);
    const cartIdKey = useMemo(() => (
        items.map((item) => item.productId).sort((left, right) => left - right).join(",")
    ), [items]);
    const [cartRefreshLoading, setCartRefreshLoading] = useState(false);
    const [cartRefreshError, setCartRefreshError] = useState(false);
    const [cartRefreshKey, setCartRefreshKey] = useState(0);
    const [removeCandidate, setRemoveCandidate] = useState<{ productId: number; name: string } | null>(null);
    const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
    const total = useMemo(() => (
        items.reduce((sum, item) => sum + ((item.snapshot?.price ?? 0) * item.quantity), 0)
    ), [items]);

    useEffect(() => {
        itemsRef.current = items;
    }, [items]);

    useEffect(() => {
        if (!cartIdKey) {
            return;
        }

        let cancelled = false;
        const ids = cartIdKey.split(",").map(Number).filter(Boolean);

        const refreshCart = async () => {
            setCartRefreshLoading(true);
            setCartRefreshError(false);

            try {
                const response = await PublicApiController.getProductBatchSummary(ids, locale);
                if (!cancelled) {
                    response.items.forEach((product) => (
                        updateItemSnapshot(createProductSnapshotFromBatchSummary(product))
                    ));
                    const byId = new Map(itemsRef.current.map((item) => [item.productId, item.snapshot]));
                    response.missingIds.forEach((productId) => {
                        const snapshot = byId.get(productId);
                        if (snapshot) {
                            updateItemSnapshot(markProductSnapshotUnavailable(snapshot));
                        }
                    });
                }
            } catch {
                if (!cancelled) setCartRefreshError(true);
            } finally {
                if (!cancelled) {
                    setCartRefreshLoading(false);
                }
            }
        };

        void refreshCart();

        return () => {
            cancelled = true;
        };
    }, [cartIdKey, cartRefreshKey, locale, updateItemSnapshot]);

    const increaseQuantity = (snapshot?: ProductSnapshot) => {
        if (!snapshot) {
            actionToasts.cartFailed();
            return;
        }

        const result = addItem(snapshot);

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

        actionToasts.cartQuantityUpdated();
        trackProductEvent(snapshot.id, "ADD_TO_CART");
    };

    const decreaseQuantity = (productId: number) => {
        const result = decrementItem(productId);

        if (!result.ok) {
            actionToasts.cartFailed();
            return;
        }

        if (result.status !== "noop") {
            trackProductEvent(productId, "REMOVE_FROM_CART");
        }
    };

    const checkoutViaWhatsApp = () => {
        const checkoutIssue = getCartCheckoutIssue(items);

        if (checkoutIssue === "empty") {
            actionToasts.cartCheckoutEmpty();
            return;
        }

        if (checkoutIssue === "missingProductData") {
            actionToasts.cartCheckoutMissingData();
            return;
        }

        if (checkoutIssue === "unavailable") {
            actionToasts.cartCheckoutUnavailable();
            return;
        }

        if (checkoutIssue === "stockLimit") {
            actionToasts.cartStockLimit();
            return;
        }

        const message = buildWhatsAppOrderMessage(items, {
            currencySymbol: goodT("currencySymbol"),
            labels: {
                greeting: cartT("whatsapp.greeting"),
                quantity: cartT("whatsapp.quantity"),
                unitPrice: cartT("whatsapp.unitPrice"),
                lineTotal: cartT("whatsapp.lineTotal"),
                article: cartT("whatsapp.article"),
                total: cartT("whatsapp.total"),
                piece: cartT("whatsapp.piece"),
            },
            locale: activeLocale,
        });

        window.open(buildWhatsAppOrderUrl(CONTACT_LINKS.whatsapp, message), "_blank", "noopener,noreferrer");
    };

    const removeProduct = (productId: number) => {
        const result = removeItem(productId);

        if (!result.ok) {
            actionToasts.cartFailed();
            return;
        }

        if (result.status !== "noop") {
            trackProductEvent(productId, "REMOVE_FROM_CART");
        }
    };

    const clearProducts = () => {
        const productIds = items.map((item) => item.productId);
        const result = clearCart();

        if (!result.ok) {
            actionToasts.cartFailed();
            return;
        }

        if (result.status !== "noop") {
            productIds.forEach((productId) => trackProductEvent(productId, "REMOVE_FROM_CART"));
        }
    };

    return (
        <main className="mx-auto max-w-360 responsive-page-x pt-10 sm:pt-12">
            <div className="flex flex-wrap items-center justify-between gap-6">
                <Heading as="h1" size="h2" font="mono" colors="headingPrimary">
                    {cartT("title")}
                </Heading>

                {items.length ? (
                    <button
                        type="button"
                        className="inline-flex min-h-11 items-center gap-3 text-sm text-text-heading-secondary transition hover:text-text-heading-primary"
                        onClick={() => setClearConfirmOpen(true)}
                    >
                        <Trash2 className="size-5" aria-hidden="true"/>
                        {cartT("clear")}
                    </button>
                ) : null}
            </div>

            {!items.length ? (
                <EmptyState
                    visual="cart"
                    title={stateT("cart.emptyTitle")}
                    description={stateT("cart.emptyDescription")}
                    action={{
                        label: stateT("actions.goCatalog"),
                        href: routes.catalog({page: 1}),
                    }}
                    className="mt-12"
                />
            ) : (
                <>
                    {items.length && cartRefreshError ? (
                        <ErrorState
                            compact
                            title={stateT("cart.loadErrorTitle")}
                            description={stateT("cart.loadErrorDescription")}
                            retryLabel={stateT("actions.retry")}
                            onRetry={() => setCartRefreshKey((key) => key + 1)}
                            className="mt-10"
                        />
                    ) : null}

                    {items.length && cartRefreshLoading && items.every((item) => !item.snapshot) ? (
                        <Text size="bodyLg" colors="muted" className="mt-12">
                            {cartT("loading")}
                        </Text>
                    ) : null}

                    <div className="mt-10 grid gap-10 sm:mt-14 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
                        <div className="flex flex-col gap-6">
                        {items.map((item) => {
                            const snapshot = item.snapshot;
                            const href = snapshot?.href ?? routes.product(item.productId);
                            const productName = snapshot?.name ?? cartT("unknownProduct", {id: item.productId});
                            const productPrice = snapshot?.price ?? 0;
                            const unavailable = snapshot ? isProductUnavailable(snapshot) : true;
                            const availableStock = snapshot ? getAvailableStock(snapshot) : null;
                            const stockLimitReached = snapshot ? isStockLimitReached(snapshot, item.quantity) : false;
                            const canIncrease = snapshot ? canIncreaseCartItem(snapshot, item.quantity) : false;
                            const showStockLimitMessage = stockLimitReached && availableStock != null;
                            const increaseButton = (
                                <button
                                    type="button"
                                    aria-label={cartT("increase", {name: productName})}
                                    disabled={!canIncrease}
                                    className="flex size-11 items-center justify-center rounded-full border border-border-default transition hover:bg-button-bg-action/10 disabled:cursor-not-allowed disabled:opacity-45"
                                    onClick={() => increaseQuantity(snapshot)}
                                >
                                    <Plus className="size-5" aria-hidden="true"/>
                                </button>
                            );

                            return (
                                <article
                                    key={item.productId}
                                    className="grid gap-5 border-b border-border-default pb-6 sm:grid-cols-[120px_minmax(0,1fr)_auto]"
                                >
                                    <Link href={href} className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40">
                                        <div className="flex aspect-square w-30 items-center justify-center overflow-hidden rounded-2xl border border-border-default bg-surface-card">
                                            {snapshot?.imageUrl ? (
                                                <Image
                                                    src={snapshot.imageUrl}
                                                    alt={productName}
                                                    width={120}
                                                    height={120}
                                                    className="h-full w-auto object-contain"
                                                    unoptimized
                                                />
                                            ) : (
                                                <ProductImageFallback compact className="h-full w-full rounded-2xl border-0"/>
                                            )}
                                        </div>
                                    </Link>

                                    <div className="min-w-0">
                                        <Link href={href} className="rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40">
                                            <Text size="bodyXl" colors="headingPrimary" className="product-card-title leading-tight">
                                                {productName}
                                            </Text>
                                        </Link>
                                        {snapshot?.collection?.name ? (
                                            <Text size="bodyMd" colors="muted" className="product-card-meta mt-2 leading-snug">
                                                {goodT("collectionWithName", {collection: snapshot.collection.name})}
                                            </Text>
                                        ) : null}
                                        {unavailable ? (
                                            <Text size="bodySm" className="mt-3 text-error">
                                                {goodT("outOfStock")}
                                            </Text>
                                        ) : null}
                                        {showStockLimitMessage ? (
                                            <Text size="caption" colors="muted" className="mt-3">
                                                {cartT("stockLimitInline", {stockQuantity: availableStock})}
                                            </Text>
                                        ) : null}
                                        <Text size="bodyLg" className="mt-5">
                                            {formatProductPrice(productPrice, activeLocale, goodT("currencySymbol"))}
                                        </Text>
                                    </div>

                                    <div className="flex items-center justify-between gap-5 sm:justify-end">
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                aria-label={cartT("decrease", {name: productName})}
                                                className="flex size-11 items-center justify-center rounded-full border border-border-default transition hover:bg-button-bg-action/10"
                                                onClick={() => decreaseQuantity(item.productId)}
                                            >
                                                <Minus className="size-5" aria-hidden="true"/>
                                            </button>
                                            <Text as="span" size="bodyLg" className="min-w-8 text-center">
                                                {item.quantity}
                                            </Text>
                                            {stockLimitReached ? (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="inline-flex">{increaseButton}</span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {cartT("stockLimitTooltip")}
                                                    </TooltipContent>
                                                </Tooltip>
                                            ) : increaseButton}
                                        </div>
                                        <button
                                            type="button"
                                            aria-label={cartT("remove", {name: productName})}
                                            className="flex size-11 items-center justify-center rounded-full text-text-heading-secondary transition hover:text-text-heading-primary"
                                            onClick={() => setRemoveCandidate({productId: item.productId, name: productName})}
                                        >
                                            <Trash2 className="size-5" aria-hidden="true"/>
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                        </div>

                        <aside className="sticky bottom-0 z-20 h-fit rounded-2xl border border-border-default bg-primary-bg px-6 py-5 shadow-state lg:static lg:px-8 lg:py-7">
                        <Text size="bodyLg" colors="headingSecondary">
                            {cartT("total")}
                        </Text>
                        <Text size="h5" colors="headingPrimary" className="mt-4">
                            {formatProductPrice(total, activeLocale, goodT("currencySymbol"))}
                        </Text>
                        {items.length ? (
                            <Button
                                variant="action"
                                className="mt-8 w-full"
                                onClick={checkoutViaWhatsApp}
                            >
                                {cartT("checkout")}
                            </Button>
                        ) : (
                            <Button
                                variant="action"
                                className="mt-8 w-full"
                                disabled
                            >
                                {cartT("checkout")}
                            </Button>
                        )}
                        </aside>
                    </div>
                </>
            )}

            <AlertDialog
                open={Boolean(removeCandidate)}
                onOpenChange={(open) => {
                    if (!open) {
                        setRemoveCandidate(null);
                    }
                }}
            >
                <AlertDialogContent closeLabel={cartT("confirmRemove.cancel")}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{cartT("confirmRemove.title")}</AlertDialogTitle>
                        <AlertDialogDescription>{cartT("confirmRemove.description")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel asChild>
                            <Button variant="default" className="w-full sm:w-auto">
                                {cartT("confirmRemove.cancel")}
                            </Button>
                        </AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <Button
                                variant="action"
                                className="w-full sm:w-auto"
                                onClick={() => {
                                    if (removeCandidate) {
                                        removeProduct(removeCandidate.productId);
                                    }
                                    setRemoveCandidate(null);
                                }}
                            >
                                {cartT("confirmRemove.confirm")}
                            </Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
                <AlertDialogContent closeLabel={cartT("confirmClear.cancel")}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{cartT("confirmClear.title")}</AlertDialogTitle>
                        <AlertDialogDescription>{cartT("confirmClear.description")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel asChild>
                            <Button variant="default" className="w-full sm:w-auto">
                                {cartT("confirmClear.cancel")}
                            </Button>
                        </AlertDialogCancel>
                        <AlertDialogAction asChild>
                            <Button
                                variant="action"
                                className="w-full sm:w-auto"
                                onClick={() => {
                                    clearProducts();
                                    setClearConfirmOpen(false);
                                }}
                            >
                                {cartT("confirmClear.confirm")}
                            </Button>
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </main>
    );
};

export default CartPage;
