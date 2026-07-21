import React from "react";

import {PublicApiController} from "@/api/controllers/PublicController";
import {IProductRecommendation} from "@/api/types/ProductTypes";
import GoodsCarouselWithImage from "@/components/ui/shared/GoodsCarouselWithImage";
import SectionWithTitle from "@/components/ui/shared/SectionWithTitle";
import {routes} from "@/config/routes";
import {LocaleEnum} from "@/i18n/routing";

type ProductRecommendationLoader = (
    productId: number | string,
    locale: LocaleEnum
) => Promise<IProductRecommendation[]>;

export async function loadProductRecommendations(
    productId: number | string,
    locale: LocaleEnum,
    loader: ProductRecommendationLoader = (id, lang) => (
        PublicApiController.getProductRecommendations(id, lang)
    )
): Promise<IProductRecommendation[]> {
    try {
        return await loader(productId, locale);
    } catch (error) {
        console.error(`Recommendation request failed productId=${productId} locale=${locale}`, error);
        return [];
    }
}

type Props = {
    title: string;
    items: IProductRecommendation[];
};

const ProductRecommendations = ({title, items}: Props) => {
    if (!items.length) {
        return null;
    }

    const carouselItems = items.map((item) => ({
        ...item,
        collection: item.collection ?? undefined,
        link: routes.product(item.id),
    }));

    return (
        <SectionWithTitle title={title}>
            <GoodsCarouselWithImage
                items={carouselItems}
                showBanner={false}
                showProductActions
                className="mt-6"
            />
        </SectionWithTitle>
    );
};

export default ProductRecommendations;

type AsyncProps = {
    title: string;
    productId: number | string;
    locale: LocaleEnum;
};

export const AsyncProductRecommendations = async ({title, productId, locale}: AsyncProps) => {
    const items = await loadProductRecommendations(productId, locale);
    return <ProductRecommendations title={title} items={items}/>;
};
