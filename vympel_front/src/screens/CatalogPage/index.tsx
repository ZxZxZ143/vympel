import React, {FC} from "react";
import BannerWithFlorContent from "@/components/ui/shared/BannerWithPageContent";
import {LocaleEnum} from "@/i18n/routing";
import CategoryBreadCrumbs from "@/components/CatalogPage/Catalog/CategoryBreadCrumbs";
import Catalog from "@/components/CatalogPage/Catalog";
import MarketPlaces from "@/components/MarketPlaces";
import Benefits from "@/components/Benefits";
import SectionWithTitle from "@/components/ui/shared/SectionWithTitle";
import {getTranslations} from "next-intl/server";
import Sort from "@/components/CatalogPage/Catalog/Sort";
import CatalogFilters from "@/components/CatalogPage/Catalog/Filters";
import ProductSearchForm from "@/components/ProductPage/ProductSearchForm";
import CategorySelector from "@/components/CatalogPage/Catalog/CategorySelector";
import AccessorySplitControls from "@/components/CatalogPage/Catalog/AccessorySplitControls";
import ContactBanner from "@/components/ui/shared/ContactBanner";
import {PublicApiController} from "@/api/controllers/PublicController";
import {cmsImageSources, findCmsBlock} from "@/utils/cmsContent";
import {
    catalogHeroFallback,
    findCatalogHeroBlock,
    isAccessoryCategoryCode
} from "@/utils/catalogCategories";
import {ICategoryWithParent} from "@/api/types/CategoryTypes";

type Props = {
    categoryCode: string | undefined;
    locale: LocaleEnum;
    initialCategory: ICategoryWithParent | null;
}


const CatalogPage: FC<Props> = async ({categoryCode, locale, initialCategory}) => {
    const t = await getTranslations("title")
    const catalogT = await getTranslations("catalog");
    const productT = await getTranslations("product");
    const cmsPage = await PublicApiController.getCmsPage("catalog", locale).catch(() => null);
    const cmsBlocks = cmsPage?.blocks ?? [];
    const isAccessories = isAccessoryCategoryCode(categoryCode);
    const heroBlock = findCatalogHeroBlock(cmsBlocks, categoryCode);
    const heroFallback = catalogHeroFallback(categoryCode);
    const heroImages = cmsImageSources(heroBlock, locale, heroFallback);
    const contactBlock = findCmsBlock(cmsBlocks, "catalog.contactBanner");
    const contactImages = cmsImageSources(contactBlock, locale, "/contact-banner-catalog.webp");

    return (
        <main>
            <h1 className="sr-only">{initialCategory?.name ?? catalogT("allGoods")}</h1>
            <BannerWithFlorContent
                image={heroImages.desktop}
                mobileImage={heroImages.mobile}
                fallbackImage={heroImages.fallback}
                alt={heroBlock?.translation?.altText ?? undefined}
                imageClassName="catalog-page-banner-image"
                contentClassName="catalog-toolbar-shell"
            >
                <div className="search-toolbar catalog-toolbar relative flex w-full min-w-0 flex-col gap-3 min-[768px]:static min-[1440px]:flex-row min-[1440px]:items-center min-[1440px]:gap-10">
                    <div className="flex min-w-0 flex-nowrap items-center gap-2 pr-14 min-[1440px]:gap-10 min-[1440px]:pr-0">
                        <CategorySelector locale={locale} categoryCode={categoryCode}/>
                        {!isAccessories ? <CatalogFilters locale={locale} categoryCode={categoryCode}/> : null}
                        <Sort />
                        {isAccessories ? (
                            <div className="hidden min-[1440px]:block">
                                <AccessorySplitControls categoryCode={categoryCode}/>
                            </div>
                        ) : null}
                    </div>

                    {isAccessories ? (
                        <div className="min-w-0 min-[1440px]:hidden">
                            <AccessorySplitControls categoryCode={categoryCode}/>
                        </div>
                    ) : null}

                    <ProductSearchForm
                        mobileIconOnly
                        variant="catalog"
                        className="rounded-2xl"
                    />
                </div>
            </BannerWithFlorContent>
            <div className="max-w-360 mx-auto responsive-page-x">
                <div className="w-full">
                    <CategoryBreadCrumbs
                        categoryCode={categoryCode}
                        locale={locale}
                        initialCategory={initialCategory}
                    />
                    <div className="w-full">
                        <Catalog locale={locale} categoryCode={categoryCode}/>
                    </div>
                </div>
                <div className="mt-[var(--spacing-responsive-section-y)] flex flex-col gap-[var(--spacing-responsive-section-y)]">
                    <SectionWithTitle title={t("marketplaces")} spacing="none">
                        <MarketPlaces />
                    </SectionWithTitle>
                    <SectionWithTitle title={productT("contact.heading")} spacing="none">
                        <ContactBanner
                            imageSrc={contactImages.desktop}
                            imageMobileSrc={contactImages.mobile}
                            imageFallbackSrc={contactImages.fallback}
                            title={productT("contact.bannerTitle")}
                            buttonText={productT("contact.button")}
                            requestSource={categoryCode ? `catalog_contact_banner:${categoryCode}` : "catalog_contact_banner"}
                            sideText={[
                                productT("contact.body1"),
                                productT("contact.body2"),
                                productT("contact.body3"),
                            ]}
                        />
                    </SectionWithTitle>
                    <Benefits />
                </div>
            </div>
        </main>
    );
};

export default CatalogPage;
