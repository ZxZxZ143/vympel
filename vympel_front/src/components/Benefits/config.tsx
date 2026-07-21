import React from "react";
import type { BenefitsItemProps } from "@/components/Benefits/Item";
import { Text } from "@/components/ui/shared/text";
import type { useTranslations } from "use-intl";
import BasketFill from "@/assets/icons/BasketFill";
import CreditCardFill from "@/assets/icons/CreditCardFill";
import Refresh from "@/assets/icons/Refresh";

type T = ReturnType<typeof useTranslations>;

export const getBenefitsConfig = (t: T): (BenefitsItemProps & { id: number })[] => [
    {
        id: 1,
        icon: <BasketFill className="h-auto w-9 sm:w-13" />,
        text: t("marketplaces"),
        subtext: (
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 sm:gap-4">
                <Text colors="placeholder" size="bodyXs">Kaspi.kz</Text>
                <Text colors="placeholder" size="bodyXs">Ozon</Text>
                <Text colors="placeholder" size="bodyXs">Wildberries</Text>
            </div>
        ),
        className: "lg:justify-start",
    },
    {
        id: 2,
        icon: <CreditCardFill className="h-auto w-9 sm:w-13" />,
        text: t("payment"),
        subtext: (
            <Text colors="placeholder" size="bodyXs">{t("paymentSub")}</Text>
        ),
    },
    {
        id: 3,
        icon: <Refresh className="h-auto w-9 sm:w-13" />,
        text: t("return"),
        subtext: (
            <Text colors="placeholder" size="bodyXs">{t("returnSub")}</Text>
        ),
        className: "lg:justify-end",
    },
];
