import {useTranslations} from "use-intl";
import {BrandCarouselCardProps} from "@/components/HomePage/BrandsCarousel/Card";
import {PUBLIC_BRANDS} from "@/config/brandRoutes";
import {routes} from "@/config/routes";

export const BrandsCarouselConfig = (): Array<BrandCarouselCardProps> => {
    const t = useTranslations("brands")

    const conf = PUBLIC_BRANDS.slice(0, -1)

    return conf.map((brand) => ({
        img: "/" + brand.slug + ".webp",
        name: brand.breadcrumbName,
        description: t(brand.slug),
        link: routes.brand(brand.slug),
    }));
}
