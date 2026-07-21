import React from "react";
import {getTranslations} from "next-intl/server";

import {LocaleEnum} from "@/i18n/routing";
import {Link} from "@/i18n/navigation";
import {PublicApiController} from "@/api/controllers/PublicController";
import ProductGallery from "@/components/ProductPage/ProductGallery";
import ProductSummary from "@/components/ProductPage/ProductSummary";
import ProductInfoTabs from "@/components/ProductPage/ProductInfoTabs";
import ProductSearchForm from "@/components/ProductPage/ProductSearchForm";
import {AsyncProductRecommendations} from "@/components/ProductPage/ProductRecommendations";
import SectionWithTitle from "@/components/ui/shared/SectionWithTitle";
import ContactBanner from "@/components/ui/shared/ContactBanner";
import BannerWithFlorContent from "@/components/ui/shared/BannerWithPageContent";
import {Text} from "@/components/ui/shared/text";
import EmptyState from "@/components/ui/shared/EmptyState";
import ErrorState from "@/components/ui/shared/ErrorState";
import ProductAnalyticsTracker from "@/components/ProductAnalyticsTracker";
import {IProductDetails} from "@/api/types/ProductTypes";
import {PUBLIC_BRANDS, normalizeBrandLookup} from "@/config/brandRoutes";
import {PUBLIC_CATEGORY_CODES, routes} from "@/config/routes";
import {PUBLIC_BREADCRUMB_SEPARATOR} from "@/config/publicBreadcrumb";
import {cmsImageSources, findCmsBlock} from "@/utils/cmsContent";

type Props = {
    productId: string;
    locale: LocaleEnum;
    initialProduct: IProductDetails | null;
    productLoadError: boolean;
};

const ProductPage = async ({
    productId,
    locale,
    initialProduct,
    productLoadError,
}: Props) => {
    const productT = await getTranslations("product");
    const catalogT = await getTranslations("catalog");
    const stateT = await getTranslations("states");

    const [reviewsResult, cmsPage] = await Promise.all([
        PublicApiController.getProductReviews({
            productId,
            lang: locale,
            page: 0,
            size: 15,
            sort: "newest",
        }).then((reviews) => ({
            reviews,
            loadError: false,
        })).catch((error) => {
            console.error(error);
            return {
                reviews: null,
                loadError: true,
            };
        }),
        PublicApiController.getCmsPage("product", locale).catch((error) => {
            console.error(error);
            return null;
        }),
    ]);
    const cmsBlocks = cmsPage?.blocks ?? [];
    const stateBannerBlock = findCmsBlock(cmsBlocks, "product.stateBanner");
    const stateBannerImages = cmsImageSources(stateBannerBlock, locale, "/product-banner.jpg");

    if (productLoadError) {
        return (
            <ProductStateShell
                heading={stateT("product.errorTitle")}
                bannerImage={stateBannerImages.desktop}
                bannerMobileImage={stateBannerImages.mobile}
                bannerFallbackImage={stateBannerImages.fallback}
                bannerAlt={stateBannerBlock?.translation?.altText ?? undefined}
            >
                <ErrorState
                    title={stateT("product.errorTitle")}
                    description={stateT("product.errorDescription")}
                    retryLabel={stateT("actions.retry")}
                    action={{
                        label: stateT("actions.goCatalog"),
                        href: routes.catalog({page: 1}),
                    }}
                />
            </ProductStateShell>
        );
    }

    const product = initialProduct;

    if (!product) {
        return (
            <ProductStateShell
                heading={stateT("product.notFoundTitle")}
                bannerImage={stateBannerImages.desktop}
                bannerMobileImage={stateBannerImages.mobile}
                bannerFallbackImage={stateBannerImages.fallback}
                bannerAlt={stateBannerBlock?.translation?.altText ?? undefined}
            >
                <EmptyState
                    visual="product"
                    title={stateT("product.notFoundTitle")}
                    description={stateT("product.notFoundDescription")}
                    action={{
                        label: stateT("actions.goCatalog"),
                        href: routes.catalog({page: 1}),
                    }}
                    secondaryAction={{
                        label: stateT("actions.goHome"),
                        href: routes.home(),
                    }}
                />
            </ProductStateShell>
        );
    }

    const heroBlock = findCmsBlock(cmsBlocks, "product.heroBanner");
    const heroImages = cmsImageSources(heroBlock, locale, "/product-hero-banner.webp");
    const contactBlock = findCmsBlock(cmsBlocks, "product.contactBanner");
    const contactImages = cmsImageSources(contactBlock, locale, "/contact_banner.png");

    const breadcrumbs = buildProductBreadcrumbs(product, {
        home: catalogT("home"),
        catalog: catalogT("allGoods"),
    });

    return (
        <main>
            <ProductAnalyticsTracker productId={product.id}/>
            <BannerWithFlorContent
                image={heroImages.desktop}
                mobileImage={heroImages.mobile}
                fallbackImage={heroImages.fallback}
                alt={heroBlock?.translation?.altText ?? undefined}
                imageClassName="object-center lg:min-h-150"
            >
                <div className="search-toolbar product-search-toolbar relative flex justify-end max-lg:min-h-12">
                    <ProductSearchForm variant="product" mobileIconOnly/>
                </div>
            </BannerWithFlorContent>

            <div className="mx-auto max-w-360 responsive-page-x">
                <div className="bg-primary-bg pb-16 pt-7">
                    <nav
                        aria-label={productT("breadcrumbsAria")}
                        className="public-breadcrumb catalog-filter-scroll mb-10 flex flex-nowrap items-center gap-2 overflow-x-auto pb-2 sm:mb-15 sm:flex-wrap sm:overflow-visible sm:pb-0"
                    >
                        {breadcrumbs.map((breadcrumb, index) => (
                            <React.Fragment key={`${breadcrumb.label}-${index}`}>
                                {index > 0 ? (
                                    <Text as="span" colors="primary" size="bodySm" weight="light" className="whitespace-nowrap text-breadcrumb leading-7">
                                        {PUBLIC_BREADCRUMB_SEPARATOR}
                                    </Text>
                                ) : null}
                                {breadcrumb.href ? (
                                    <Link
                                        href={breadcrumb.href}
                                        className="rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40"
                                    >
                                        <Text as="span" colors="primary" size="bodySm" weight="light" className="whitespace-nowrap text-breadcrumb leading-7">
                                            {breadcrumb.label}
                                        </Text>
                                    </Link>
                                ) : (
                                    <Text as="span" colors="primary" size="bodySm" weight="light" className="whitespace-nowrap text-breadcrumb leading-7">
                                        {breadcrumb.label}
                                    </Text>
                                )}
                            </React.Fragment>
                        ))}
                    </nav>

                    <div
                        className="grid gap-10 lg:grid-cols-[minmax(0,47.5rem)_minmax(23.75rem,1fr)] lg:items-start lg:justify-between lg:gap-15">
                        <ProductGallery images={product.images ?? []} productName={product.name}/>
                        <ProductSummary product={product}/>
                    </div>
                </div>

                <div className="bg-primary-bg">
                    <ProductInfoTabs
                        product={product}
                        description={product.description}
                        reviews={{
                            productId: product.id,
                            initialReviewsPage: reviewsResult.reviews,
                            loadError: reviewsResult.loadError,
                            ratingAverage: product.ratingAverage,
                            ratingCount: product.ratingCount,
                        }}
                    />

                    <React.Suspense fallback={null}>
                    <AsyncProductRecommendations
                        title={productT("relatedProducts")}
                        productId={productId}
                        locale={locale}
                    />
                    </React.Suspense>

                    <SectionWithTitle title={productT("contact.heading")} spacing="subsection">
                        <ContactBanner
                            imageSrc={contactImages.desktop}
                            imageMobileSrc={contactImages.mobile}
                            imageFallbackSrc={contactImages.fallback}
                            title={productT("contact.bannerTitle")}
                            buttonText={productT("contact.button")}
                            requestSource="product_contact_banner"
                            sideText={[
                                productT("contact.body1"),
                                productT("contact.body2"),
                                productT("contact.body3"),
                            ]}
                        />
                    </SectionWithTitle>
                </div>
            </div>
        </main>
    );
};

export default ProductPage;

type ProductStateShellProps = {
    children: React.ReactNode;
    heading: string;
    bannerImage: string;
    bannerMobileImage: string;
    bannerFallbackImage: string;
    bannerAlt?: string;
};

const ProductStateShell = ({
    children,
    heading,
    bannerImage,
    bannerMobileImage,
    bannerFallbackImage,
    bannerAlt,
}: ProductStateShellProps) => (
    <main>
        <h1 className="sr-only">{heading}</h1>
        <BannerWithFlorContent
            image={bannerImage}
            mobileImage={bannerMobileImage}
            fallbackImage={bannerFallbackImage}
            alt={bannerAlt}
            imageClassName="object-center lg:min-h-150"
        >
            <div className="min-h-10"/>
        </BannerWithFlorContent>
        <div className="mx-auto max-w-360 responsive-page-x py-20">
            {children}
        </div>
    </main>
);

type ProductBreadcrumb = {
    label: string;
    href?: string;
};

function buildProductBreadcrumbs(
    product: IProductDetails,
    labels: { home: string; catalog: string }
): ProductBreadcrumb[] {
    const brandRoute = getProductBrandRoute(product);
    const productCategoryCode = product.category?.code ?? PUBLIC_CATEGORY_CODES.wrist;

    return [
        {label: labels.home, href: routes.home()},
        {label: labels.catalog, href: routes.catalog({page: 1})},
        product.category?.name ? {
            label: product.category.name,
            href: routes.category(product.category.code),
        } : null,
        product.brand?.name ? {
            label: product.brand.name,
            href: brandRoute ?? routes.filteredCatalog({filters: {brand: product.brand.id}}),
        } : null,
        product.watchDetails?.gender ? {
            label: product.watchDetails.gender.name,
            href: routes.filteredCatalog({
                categoryCode: PUBLIC_CATEGORY_CODES.wrist,
                filters: {gender: product.watchDetails.gender.id},
            }),
        } : null,
        product.watchDetails?.caseMaterial ? {
            label: product.watchDetails.caseMaterial.name,
            href: routes.filteredCatalog({
                categoryCode: productCategoryCode,
                filters: {caseMaterial: product.watchDetails.caseMaterial.id},
            }),
        } : null,
        product.interiorClockDetails?.caseMaterial ? {
            label: product.interiorClockDetails.caseMaterial.name,
            href: routes.filteredCatalog({
                categoryCode: productCategoryCode,
                filters: {interiorCaseMaterial: product.interiorClockDetails.caseMaterial.id},
            }),
        } : null,
        product.collection?.name ? {label: product.collection.name} : null,
        {label: product.name},
    ].filter((breadcrumb): breadcrumb is ProductBreadcrumb => Boolean(breadcrumb?.label));
}

function getProductBrandRoute(product: IProductDetails): string | undefined {
    const brandName = product.brand?.name;

    if (!brandName) {
        return undefined;
    }

    const normalizedBrandName = normalizeBrandLookup(brandName);
    const publicBrand = PUBLIC_BRANDS.find((brand) => (
        brand.matchingNames.some((name) => normalizeBrandLookup(name) === normalizedBrandName)
    ));

    return publicBrand ? routes.brand(publicBrand.slug) : undefined;
}
