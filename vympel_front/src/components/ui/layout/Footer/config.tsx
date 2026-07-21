import {useTranslations} from "use-intl";
import {FooterListType} from "@/components/ui/layout/Footer/type";
import {catalogLinks, routes} from "@/config/routes";

export const ConfigFirstList = (): Array<FooterListType> => {
    const t = useTranslations("footer")

    return (
        [
            {
                text: t("wristWatches"),
                link: catalogLinks.wristWatches,
            },
            {
                text: t("interiorWatches"),
                link: catalogLinks.interiorWatches,
            },
            {
                text: t("accessories"),
                link: catalogLinks.accessories,
            },
            {
                text: t("brands"),
                link: routes.brands(),
            }
        ]
    )
}

export const ConfigSecondList = (): Array<FooterListType> => {
    const t = useTranslations("footer")

    return (
        [
            {
                text: t("menWatches"),
                link: catalogLinks.menWatches,
            },
            {
                text: t("womenWatches"),
                link: catalogLinks.womenWatches,
            },
            {
                text: t("sportWatches"),
                link: catalogLinks.sportWatches,
            },
            {
                text: t("kidsWatches"),
                link: catalogLinks.kidsWatches,
            }
        ]
    )
}

export const ConfigThirdList = (): Array<FooterListType> => {
    const t = useTranslations("footer")

    return (
        [
            {
                text: t("about"),
                link: routes.about(),
            },
            {
                text: t("payment"),
                link: routes.payment(),
            },
            {
                text: t("warranty"),
                link: routes.guarantee(),
            },
            {
                text: t("delivery"),
                link: routes.delivery(),
            }
        ]
    )
}
