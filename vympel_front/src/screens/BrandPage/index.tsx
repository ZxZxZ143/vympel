import {getTranslations} from "next-intl/server";
import {notFound} from "next/navigation";

import Navigation from "@/components/ui/layout/Navigation";
import BrandProductsGrid from "@/components/BrandPage/BrandProductsGrid";
import {Text} from "@/components/ui/shared/text";
import {Heading} from "@/components/ui/shared/text/Heading";
import {Link} from "@/i18n/navigation";
import {LocaleEnum} from "@/i18n/routing";
import {PublicApiController} from "@/api/controllers/PublicController";
import {ICatalogFiltersResponse, IProduct} from "@/api/types/ProductTypes";
import {ProductSortEnum} from "@/enums/SortEnum";
import ArrowRight from "@/assets/icons/ArrowRight";
import {getBrandPageData, BrandPageData} from "@/config/brandPages";
import {normalizeBrandLookup} from "@/config/brandRoutes";
import {cn} from "@/lib/utils";
import {routes} from "@/config/routes";
import {PUBLIC_BREADCRUMB_SEPARATOR} from "@/config/publicBreadcrumb";
import CmsResponsiveImage from "@/components/ui/shared/CmsResponsiveImage";
import {cmsImageSources, findCmsBlock} from "@/utils/cmsContent";

type Props = {
    locale: LocaleEnum;
    brandSlug: string;
    initialBrand: BrandPageData;
};

const BrandPage = async ({locale, brandSlug, initialBrand}: Props) => {
    const t = await getTranslations({locale, namespace: "brandPage"});
    const catalogT = await getTranslations({locale, namespace: "catalog"});
    const brand = initialBrand ?? getBrandPageData(brandSlug, locale);

    if (!brand) {
        notFound();
    }

    const cmsPage = await PublicApiController.getCmsPage("brands", locale).catch((error) => {
        console.error(error);
        return null;
    });
    const cmsBlocks = cmsPage?.blocks ?? [];
    const heroBlock = findCmsBlock(cmsBlocks, `brands.${brand.slug}.heroBanner`);
    const heroImages = cmsImageSources(heroBlock, locale, brand.brandBannerSrc);
    let brandFilterValue: string | undefined;
    let products: IProduct[] = [];
    let productsError = false;

    try {
        const filters = await PublicApiController.getCatalogFilters(locale);
        brandFilterValue = getBrandFilterValue(filters, brand);
    } catch (error) {
        console.error(error);
        productsError = true;
    }

    if (brandFilterValue) {
        try {
            const response = await PublicApiController.getCatalogProducts({
                lang: locale,
                page: 0,
                size: 15,
                sort: ProductSortEnum.NEWEST,
                filters: {
                    brand: [brandFilterValue],
                },
            });
            products = response.content;
        } catch (error) {
            console.error(error);
            productsError = true;
        }
    } else {
        productsError = true;
    }

    const catalogHref = brandFilterValue
        ? routes.filteredCatalog({filters: {brand: brandFilterValue}})
        : routes.catalog({page: 1});

    return (
        <main className="mx-auto max-w-360">
            <Navigation/>

            <div className="responsive-page-x pt-10 sm:pt-12">
                <nav
                    aria-label={t("breadcrumbsAria")}
                    className="public-breadcrumb catalog-filter-scroll flex max-w-full flex-nowrap items-center gap-2 overflow-x-auto overflow-y-hidden whitespace-nowrap pb-2"
                >
                    <Link href={routes.home()}
                          className="shrink-0 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40">
                        <Text as="span" colors="primary" size="bodyLg" weight="light" className="text-breadcrumb leading-none">
                            {catalogT("home")}
                        </Text>
                    </Link>
                    <Text as="span" colors="primary" size="bodyLg" weight="light" className="shrink-0 text-breadcrumb leading-none">
                        {PUBLIC_BREADCRUMB_SEPARATOR}
                    </Text>
                    <Link href={routes.brands()}
                          className="shrink-0 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40">
                        <Text as="span" colors="primary" size="bodyLg" weight="light" className="text-breadcrumb leading-none">
                            {t("breadcrumbBrands")}
                        </Text>
                    </Link>
                    <Text as="span" colors="primary" size="bodyLg" weight="light" className="shrink-0 text-breadcrumb leading-none">
                        {PUBLIC_BREADCRUMB_SEPARATOR}
                    </Text>
                    <Text as="span" colors="primary" size="bodyLg" weight="light" className="shrink-0 text-breadcrumb leading-none">
                        {brand.breadcrumbName}
                    </Text>
                </nav>

                <section aria-labelledby="brand-page-title" className="pt-brand-title-offset">
                    <Heading
                        id="brand-page-title"
                        as="h1"
                        size="h1"
                        weight="regular"
                        className="brand-page-title mx-auto max-w-full text-center leading-tight uppercase text-text-heading-primary lg:leading-none"
                    >
                        {brand.displayName}
                    </Heading>

                    <Text
                        size="bodyMd"
                        colors="muted"
                        className="mx-auto mt-brand-description-offset max-w-[583px] text-center leading-brand-copy"
                    >
                        {brand.description}
                    </Text>

                    <BrandImage
                        src={heroImages.desktop}
                        mobileSrc={heroImages.mobile}
                        fallbackSrc={heroImages.fallback}
                        alt={t("brandBannerAlt", {brand: brand.displayName})}
                        fallback={t("bannerFallback", {brand: brand.displayName})}
                        className="brand-page-hero-image mt-brand-banner-offset"
                        priority
                    />
                </section>

                <section className="mt-brand-banner-offset" aria-labelledby="brand-history-title">
                    <Heading
                        id="brand-history-title"
                        as="h2"
                        size="productTitle"
                        weight="regular"
                        className="mb-brand-history-heading-gap leading-none"
                    >
                        {t("historyTitle")}
                    </Heading>

                    <div className="space-y-2">
                        {brand.historyParagraphs.map((paragraph) => (
                            <Text
                                key={paragraph}
                                size="bodyMd"
                                colors="secondary"
                                className="leading-brand-copy"
                            >
                                {paragraph}
                            </Text>
                        ))}
                    </div>

                    <Link
                        href={catalogHref}
                        className="mt-brand-history-text-gap inline-flex items-center gap-3 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40"
                        aria-label={t("catalogLinkAria", {brand: brand.displayName})}
                    >
                        <Text as="span" size="bodyLg" weight="medium" colors="headingSecondary"
                              className="leading-none">
                            {t("catalogLink")}
                        </Text>
                        <ArrowRight className="h-auto w-6" aria-hidden="true"/>
                    </Link>
                </section>

                <section className="relative mt-brand-products-offset" aria-labelledby="brand-products-title">
                    <Heading
                        id="brand-products-title"
                        as="h2"
                        size="h4"
                        font="mono"
                        weight="regular"
                        className="leading-none"
                    >
                        {t("newProducts")}
                    </Heading>

                    {productsError ? (
                        <Text size="bodySm" colors="secondary" className="mt-8">
                            {t("productsError")}
                        </Text>
                    ) : products.length ? (
                        <div className="relative w-full">
                            <BrandProductsGrid products={products}/>
                        </div>
                    ) : (
                        <Text size="bodySm" colors="secondary" className="mt-8">
                            {t("productsEmpty")}
                        </Text>
                    )}
                </section>
            </div>
        </main>
    );
};

export default BrandPage;

function BrandImage({
                        src,
                        mobileSrc,
                        fallbackSrc,
                        alt,
                        fallback,
                        className,
                        priority = false,
                    }: {
    src?: string;
    mobileSrc?: string;
    fallbackSrc?: string;
    alt: string;
    fallback: string;
    className?: string;
    priority?: boolean;
}) {
    return (
        <div className={cn("w-screen left-1/2 -translate-x-1/2 brand-page-image bg-surface-card", className)}>
            {src ? (
                <CmsResponsiveImage
                    desktopSrc={src}
                    mobileSrc={mobileSrc}
                    fallbackSrc={fallbackSrc ?? src}
                    alt={alt}
                    pictureClassName="absolute inset-0"
                    className="h-full w-full object-cover"
                    priority={priority}
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center px-8 text-center">
                    <Text colors="secondary">{fallback}</Text>
                </div>
            )}
        </div>
    );
}

function getBrandFilterValue(filters: ICatalogFiltersResponse | null, brand: BrandPageData): string | undefined {
    const brandFilter = filters?.filters.find((filter) => filter.key === "brand");

    if (!brandFilter) {
        return undefined;
    }

    const matchingNames = new Set(brand.matchingNames.map(normalizeBrandLookup));

    return brandFilter.options.find((option) => matchingNames.has(normalizeBrandLookup(option.label)))?.value;
}
