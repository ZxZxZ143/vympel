import {PublicApiController} from "@/api/controllers/PublicController";
import {IProduct} from "@/api/types/ProductTypes";
import {Page} from "@/api/types/PageType";
import GoodsCarouselWithImage from "@/components/ui/shared/GoodsCarouselWithImage";
import SectionWithTitle from "@/components/ui/shared/SectionWithTitle";
import {routes} from "@/config/routes";
import {ProductSortEnum} from "@/enums/SortEnum";
import {LocaleEnum} from "@/i18n/routing";

type Props = {
    title: string;
    destinationLink: string;
    locale: LocaleEnum;
    categoryCode: string;
    bannerImage: string;
    bannerMobileImage?: string;
    bannerFallbackImage?: string;
    bannerAlt?: string;
    sectionId: string;
};

async function loadCategoryProducts(
    locale: LocaleEnum,
    categoryCode: string,
    sectionId: string
): Promise<Page<IProduct> | undefined> {
    try {
        return await PublicApiController.getProductsList({
            lang: locale,
            categoryCode,
            page: 0,
            size: 20,
            sort: ProductSortEnum.NEWEST,
        });
    } catch (error: unknown) {
        console.error(`Failed to load home product carousel: ${sectionId}`, error);
        return undefined;
    }
}

async function ProductCarouselSection({
    title,
    destinationLink,
    locale,
    categoryCode,
    bannerImage,
    bannerMobileImage,
    bannerFallbackImage = bannerImage,
    bannerAlt,
    sectionId,
}: Props) {
    const products = await loadCategoryProducts(locale, categoryCode, sectionId);

    if (!products || products.content.length === 0) {
        return null;
    }

    return (
        <SectionWithTitle title={title} link={destinationLink}>
            <GoodsCarouselWithImage
                img={bannerImage}
                mobileImg={bannerMobileImage}
                fallbackImg={bannerFallbackImage}
                bannerAlt={bannerAlt}
                items={products.content.map((product) => ({
                    ...product,
                    link: routes.product(product.id),
                }))}
                showProductActions
            />
        </SectionWithTitle>
    );
}

export default ProductCarouselSection;
