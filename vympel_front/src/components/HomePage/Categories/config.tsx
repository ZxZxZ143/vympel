'use client'

import {useTranslations} from "use-intl";
import {CategoriesItemProps} from "@/components/HomePage/Categories/Item";
import {catalogLinks} from "@/config/routes";

export const CategoriesConfig = (): Array<CategoriesItemProps> => {
    const t = useTranslations("categories");

    return [
        {
            link: catalogLinks.menWatches,
            img: "/category_1.png",
            title: t("man"),
            imageClassName: "right-0 bottom-0 h-9/10"
        },
        {
            link: catalogLinks.womenWatches,
            img: "/category_2.png",
            title: t("woman"),
            imageClassName: "top-0 right-0 h-full"
        },
        {
            link: catalogLinks.kidsWatches,
            img: "/category_3.webp",
            title: t("child"),
            imageClassName: "right-0 bottom-0 h-9/10"
        },
        {
            link: catalogLinks.sportWatches,
            img: "/category_4.png",
            title: t("sport"),
            imageClassName: "top-0 right-0 h-full max-h-[338px]"
        }
    ]
}
