"use client";

import {toast} from "sonner";
import {useTranslations} from "use-intl";

import {useRouter} from "@/i18n/navigation";
import {routes} from "@/config/routes";
import {addFavoriteProduct, ProductSnapshot} from "@/services/localProductStorage";

const TOAST_DURATION = 4500;

export function useProductActionToasts() {
    const t = useTranslations("toasts");
    const router = useRouter();

    const goToFavorites = () => router.push(routes.favorites());
    const goToCart = () => router.push(routes.cart());

    return {
        favoriteAdded: () => toast.success(t("favoriteAdded"), {
            action: {
                label: t("go"),
                onClick: goToFavorites,
            },
            duration: TOAST_DURATION,
        }),
        favoriteRemoved: (snapshot: ProductSnapshot) => toast(t("favoriteRemoved"), {
            action: {
                label: t("undo"),
                onClick: () => {
                    const result = addFavoriteProduct(snapshot);
                    if (!result.ok) {
                        toast.error(t("favoriteFailed"), {duration: TOAST_DURATION});
                    }
                },
            },
            duration: TOAST_DURATION,
        }),
        favoriteFailed: () => toast.error(t("favoriteFailed"), {
            duration: TOAST_DURATION,
        }),
        cartAdded: () => toast.success(t("cartAdded"), {
            action: {
                label: t("go"),
                onClick: goToCart,
            },
            duration: TOAST_DURATION,
        }),
        cartAlreadyInCart: () => toast(t("cartAlreadyInCart"), {
            action: {
                label: t("go"),
                onClick: goToCart,
            },
            duration: TOAST_DURATION,
        }),
        cartQuantityUpdated: () => toast.success(t("cartQuantityUpdated"), {
            action: {
                label: t("go"),
                onClick: goToCart,
            },
            duration: TOAST_DURATION,
        }),
        cartOutOfStock: () => toast.warning(t("cartOutOfStock"), {
            duration: TOAST_DURATION,
        }),
        cartStockLimit: () => toast.warning(t("cartStockLimit"), {
            duration: TOAST_DURATION,
        }),
        cartCheckoutEmpty: () => toast.warning(t("cartCheckoutEmpty"), {
            duration: TOAST_DURATION,
        }),
        cartCheckoutMissingData: () => toast.error(t("cartCheckoutMissingData"), {
            duration: TOAST_DURATION,
        }),
        cartCheckoutUnavailable: () => toast.warning(t("cartCheckoutUnavailable"), {
            duration: TOAST_DURATION,
        }),
        cartFailed: () => toast.error(t("cartFailed"), {
            duration: TOAST_DURATION,
        }),
    };
}
