import GoodsCarouselWithImage from "@/components/ui/shared/GoodsCarouselWithImage";
import {PublicApiController} from "@/api/controllers/PublicController";
import {LocaleEnum} from "@/i18n/routing";
import {IProduct} from "@/api/types/ProductTypes";
import {Page} from "@/api/types/PageType";
import {ProductSortEnum} from "@/enums/SortEnum";
import {routes} from "@/config/routes";

type Props = {
    locale: LocaleEnum,
    categoryCode: string | undefined,
    bannerImage?: string,
    bannerMobileImage?: string,
    bannerFallbackImage?: string,
    bannerAlt?: string,
};

async function NewGoods({
    locale,
    categoryCode,
    bannerImage = "/newsBanner.webp",
    bannerMobileImage,
    bannerFallbackImage = "/newsBanner.webp",
    bannerAlt,
}: Props) {
    let products: Page<IProduct> | undefined = undefined;
    try {
        products = await PublicApiController.getProductsList({
            lang: locale as LocaleEnum,
            categoryCode: categoryCode ?? "",
            page: 0,
            size: 20,
            sort: ProductSortEnum.NEWEST
        });
    } catch (error: unknown) {
        console.error(error)
    }
    return (
        <GoodsCarouselWithImage
            img={bannerImage}
            mobileImg={bannerMobileImage}
            fallbackImg={bannerFallbackImage}
            bannerAlt={bannerAlt}
            items={(products?.content ?? []).map((product) => ({
                ...product,
                link: routes.product(product.id),
            }))}
            showProductActions
        />
    );
}

export default NewGoods;
