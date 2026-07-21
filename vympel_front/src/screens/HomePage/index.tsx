import React from 'react';
import Navigation from "@/components/ui/layout/Navigation";
import SectionWithTitle from "@/components/ui/shared/SectionWithTitle";
import BannerCarousel from "@/components/HomePage/bannerCarousel";
import Benefits from "@/components/Benefits";
import BrandsCarousel from "@/components/HomePage/BrandsCarousel";
import Categories from "@/components/HomePage/Categories";
import Philosophy from "@/components/HomePage/Philosophy";
import MarketPlaces from "@/components/MarketPlaces";
import {LocaleEnum} from "@/i18n/routing";
import NewGoods from "@/components/HomePage/NewGoods";
import {catalogLinks, PUBLIC_CATEGORY_CODES} from "@/config/routes";
import {PublicApiController} from "@/api/controllers/PublicController";
import {findCmsBlock, findCmsBlocksByType, cmsImageSources, cmsLink, cmsText} from "@/utils/cmsContent";

type Props = {
    titles: {
        new: string;
        brands: string;
        case: string;
        categories: string;
        accessories: string;
        philosophy: string;
        marketplaces: string;
    },
    locale: LocaleEnum,
}

async function HomePage({titles, locale}: Props) {
    const cmsPage = await PublicApiController.getCmsPage("home", locale).catch(() => null);
    const cmsBlocks = cmsPage?.blocks ?? [];
    const heroSlides = findCmsBlocksByType(cmsBlocks, "HERO_SLIDER")
        .map((block) => {
            const link = cmsLink(block);
            const images = cmsImageSources(block, locale, "/Romanson_banner.webp");

            return {
                id: block.id,
                url: images.desktop,
                mobileUrl: images.mobile,
                fallbackUrl: images.fallback,
                alt: cmsText(block.translation?.altText, "Romanson 2025 banner"),
                link: link?.href,
                external: link?.external,
                newTab: link?.newTab,
                title: block.translation?.title,
                subtitle: block.translation?.subtitle,
                buttonText: block.translation?.buttonText,
            };
        });
    const newGoodsBanner = findCmsBlock(cmsBlocks, "home.newGoodsBanner");
    const newGoodsImages = cmsImageSources(newGoodsBanner, locale, "/newsBanner.webp");

    return (
        <main className="max-w-360 mx-auto">
            <h1 className="sr-only">Vympel</h1>
            <Navigation/>
            <div className="responsive-page-x w-full">
                <BannerCarousel items={heroSlides}/>
                <Benefits/>
                <SectionWithTitle title={titles.new} link={catalogLinks.wristWatches} >
                    <NewGoods
                        locale={locale}
                        categoryCode={PUBLIC_CATEGORY_CODES.wrist}
                        bannerImage={newGoodsImages.desktop}
                        bannerMobileImage={newGoodsImages.mobile}
                        bannerFallbackImage={newGoodsImages.fallback}
                        bannerAlt={newGoodsBanner?.translation?.altText ?? undefined}
                    />
                </SectionWithTitle>
                <SectionWithTitle title={titles.brands}>
                    <BrandsCarousel />
                </SectionWithTitle>

                <SectionWithTitle title={titles.categories}>
                    <Categories />
                </SectionWithTitle>

                <SectionWithTitle title={titles.philosophy} titleClassName="mb-7 sm:mb-9 lg:mb-34">
                    <Philosophy />
                </SectionWithTitle>

                <SectionWithTitle title={titles.marketplaces}>
                    <MarketPlaces />
                </SectionWithTitle>
            </div>
        </main>
    );
};

export default HomePage;
