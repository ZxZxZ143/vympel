import type {ReactNode} from "react";
import {getTranslations} from "next-intl/server";

import {
    InfoList,
    InfoPageLayout,
    InfoParagraph,
    InfoTextBlock,
    StoreLocationBlock,
    WarrantyBadges,
} from "@/components/InfoPages";
import {Text} from "@/components/ui/shared/text";
import {LocaleEnum} from "@/i18n/routing";

export type InfoPageKind = "guarantee" | "delivery" | "payment";

type Props = {
    locale: LocaleEnum;
    page: InfoPageKind;
};

const marketplaceKeys = ["kaspi", "wildberries", "ozon"] as const;
const warrantyServiceKeys = ["deliveryToService", "diagnostics", "returnDelivery"] as const;
const paymentMethodKeys = ["cash", "cards", "transfer"] as const;

export default async function InfoPage({locale, page}: Props) {
    const t = await getTranslations({locale, namespace: "infoPages"});

    const renderStrong = (chunks: ReactNode) => (
        <Text as="span" size="bodyLg" weight="medium" colors="primary" className="leading-normal">
            {chunks}
        </Text>
    );

    const rich = (key: string) => t.rich(key, {strong: renderStrong});

    const storeBlock = (
        <StoreLocationBlock
            imageAlt={t("store.imageAlt")}
            addressTitle={t("store.address.title")}
            addressStreet={t("store.address.street")}
            addressFloor={t("store.address.floor")}
            addressDistrict={t("store.address.district")}
            addressPostalCode={t("store.address.postalCode")}
            hours={t("store.hours")}
            phone={t("store.phone")}
        />
    );

    if (page === "guarantee") {
        return (
            <InfoPageLayout title={t("guarantee.title")}>
                <InfoTextBlock>
                    <InfoParagraph>{t("guarantee.intro.paragraph1")}</InfoParagraph>
                    <InfoParagraph>{rich("guarantee.intro.paragraph2")}</InfoParagraph>
                    <InfoParagraph>{rich("guarantee.intro.paragraph3")}</InfoParagraph>
                    <InfoList items={warrantyServiceKeys.map((key) => t(`guarantee.serviceItems.${key}`))}/>
                </InfoTextBlock>

                <WarrantyBadges
                    warrantyTitle={t("guarantee.badges.warranty.title")}
                    warrantySubtitle={t("guarantee.badges.warranty.subtitle")}
                    supportTitle={t("guarantee.badges.support.title")}
                    supportSubtitle={t("guarantee.badges.support.subtitle")}
                />

                <InfoTextBlock className="mt-info-badge-section-offset">
                    <InfoParagraph>{t("guarantee.lower.paragraph1")}</InfoParagraph>
                    <InfoParagraph>{t("guarantee.lower.paragraph2")}</InfoParagraph>
                </InfoTextBlock>
            </InfoPageLayout>
        );
    }

    if (page === "delivery") {
        return (
            <InfoPageLayout title={t("delivery.title")}>
                <InfoTextBlock>
                    <InfoParagraph>{t("delivery.intro.paragraph1")}</InfoParagraph>
                    <InfoList items={marketplaceKeys.map((key) => t(`marketplaces.${key}`))}/>
                    <InfoParagraph>{rich("delivery.intro.paragraph2")}</InfoParagraph>
                    <InfoParagraph>{t("delivery.intro.paragraph3")}</InfoParagraph>
                    <InfoParagraph>{rich("delivery.intro.paragraph4")}</InfoParagraph>
                </InfoTextBlock>

                {storeBlock}

                <InfoTextBlock>
                    <InfoParagraph>{t("delivery.final")}</InfoParagraph>
                </InfoTextBlock>
            </InfoPageLayout>
        );
    }

    return (
        <InfoPageLayout title={t("payment.title")}>
            <InfoTextBlock>
                <InfoParagraph>{rich("payment.intro.paragraph1")}</InfoParagraph>
                <InfoList items={marketplaceKeys.map((key) => t(`marketplaces.${key}`))}/>
                <InfoParagraph>{t("payment.intro.paragraph2")}</InfoParagraph>
                <InfoParagraph>{rich("payment.intro.paragraph3")}</InfoParagraph>
            </InfoTextBlock>

            {storeBlock}

            <InfoTextBlock>
                <InfoParagraph>{t("payment.methodsIntro")}</InfoParagraph>
                <InfoList items={paymentMethodKeys.map((key) => t(`payment.methods.${key}`))}/>
                <InfoParagraph>{t("payment.final")}</InfoParagraph>
            </InfoTextBlock>
        </InfoPageLayout>
    );
}
