"use client";

import {ReactNode, useState} from "react";
import {useTranslations} from "use-intl";

import {IProductDetails, IProductDescription} from "@/api/types/ProductTypes";
import ProductDescription from "@/components/ProductPage/ProductDescription";
import ProductReviews, {type ProductReviewsProps} from "@/components/ProductPage/ProductReviews";
import ProductSpecs from "@/components/ProductPage/ProductSpecs";
import ArrowRight from "@/assets/icons/ArrowRight";
import {Text} from "@/components/ui/shared/text";
import {Heading} from "@/components/ui/shared/text/Heading";
import {cn} from "@/lib/utils";
import {Link} from "@/i18n/navigation";
import {PUBLIC_BRANDS, normalizeBrandLookup} from "@/config/brandRoutes";
import {PUBLIC_CATEGORY_CODES, routes} from "@/config/routes";

type Props = {
    product: IProductDetails;
    description?: IProductDescription | null;
    reviews: ProductReviewsProps;
};

const tabs = [
    {id: "description"},
    {id: "warranty"},
    {id: "delivery"},
    {id: "payment"},
    {id: "reviews"},
] as const;

type TabId = (typeof tabs)[number]["id"];

const paymentMethodKeys = ["cash", "cards", "transfer"] as const;

const ProductInfoTabs = ({product, description, reviews}: Props) => {
    const t = useTranslations("product");
    const [activeTab, setActiveTab] = useState<TabId>("description");
    const brandName = product.brand?.name ?? "VYMPEL";
    const brandCatalogHref = product.brand?.id
        ? routes.filteredCatalog({
            categoryCode: PUBLIC_CATEGORY_CODES.wrist,
            filters: {brand: product.brand.id},
        })
        : routes.catalog({page: 1});
    const publicBrand = getPublicBrandByName(product.brand?.name);
    const aboutBrandHref = publicBrand ? routes.brand(publicBrand.slug) : brandCatalogHref;
    const renderStrong = (chunks: ReactNode) => (
        <Text as="span" size="bodyLg" weight="medium" colors="primary" className="leading-normal">
            {chunks}
        </Text>
    );
    const rich = (key: string) => t.rich(key, {strong: renderStrong});

    const tabLabels: Record<TabId, string> = {
        description: t("description"),
        warranty: t("tabs.warranty"),
        delivery: t("tabs.delivery"),
        payment: t("tabs.payment"),
        reviews: t("reviews.title"),
    };

    return (
        <section className="mt-14 sm:mt-20">
            <div
                role="tablist"
                aria-label={t("tabs.ariaLabel")}
                className="catalog-filter-scroll flex snap-x items-stretch justify-start gap-product-tabs-gap overflow-x-auto overflow-y-hidden border-b border-border-default lg:justify-between"
            >
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            id={`product-tab-${tab.id}`}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            aria-controls="product-tab-panel"
                            onClick={() => setActiveTab(tab.id)}
                            className="relative flex min-h-11 shrink-0 snap-start items-start px-1 pb-product-tab-underline-gap text-left transition"
                        >
                            <Text
                                as="span"
                                size="bodyXl"
                                weight="regular"
                                colors="primary"
                                className="whitespace-nowrap text-base leading-none transition sm:text-md"
                            >
                                {tabLabels[tab.id]}
                            </Text>
                            <span
                                aria-hidden="true"
                                className={cn(
                                    "absolute -bottom-px left-1 right-1 border-t-4 border-transparent transition",
                                    isActive && "border-product-tab-underline"
                                )}
                            />
                        </button>
                    );
                })}
            </div>

            <div
                id="product-tab-panel"
                role="tabpanel"
                aria-labelledby={`product-tab-${activeTab}`}
            >
                {activeTab === "description" ? (
                    <div className="product-details-grid grid min-w-0 gap-10 pt-10 sm:pt-12 lg:grid-cols-[minmax(0,0.58fr)_minmax(20rem,0.42fr)] lg:gap-18">
                        <div className="min-w-0">
                            <Heading
                                as="h2"
                                size="h4"
                                weight="regular"
                                className="mb-8 text-center uppercase tracking-normal"
                            >
                                {brandName}
                            </Heading>
                            <ProductDescription description={description}/>
                            <div className="mt-[var(--spacing-product-details-links-offset)] flex min-w-0 flex-col gap-y-4 sm:flex-row sm:flex-wrap sm:gap-x-[var(--spacing-product-description-link-gap)]">
                                <Link href={brandCatalogHref} className="flex min-h-11 min-w-0 items-center gap-4">
                                    <Text
                                        as="span"
                                        size="bodyLg"
                                        weight="medium"
                                        colors="productSecondary"
                                        className="product-long-copy min-w-0 leading-snug"
                                    >
                                        {t("tabs.allBrandWatches", {brand: brandName})}
                                    </Text>
                                    <ArrowRight className="w-6"/>
                                </Link>
                                <Link href={aboutBrandHref} className="flex min-h-11 min-w-0 items-center gap-4">
                                    <Text
                                        as="span"
                                        size="bodyLg"
                                        weight="medium"
                                        colors="productSecondary"
                                        className="product-long-copy min-w-0 leading-snug"
                                    >
                                        {t("tabs.aboutBrand")}
                                    </Text>
                                    <ArrowRight className="w-6"/>
                                </Link>
                            </div>
                        </div>

                        <ProductSpecs
                            product={product}
                            labels={{
                                bracelet: t("details.bracelet"),
                                case: t("details.case"),
                                country: t("country"),
                                mechanismType: t("details.mechanismType"),
                                gender: t("gender"),
                                glass: t("details.glass"),
                                caseSize: t("caseSize"),
                                waterResistance: t("waterResistance"),
                                stoneInsert: t("details.stoneInsert"),
                                millimeter: t("units.millimeter"),
                                color: t("details.color"),
                                style: t("details.style"),
                                powerType: t("details.powerType"),
                                dimensions: t("details.dimensions"),
                                weight: t("details.weight"),
                                warrantyMonths: t("details.warrantyMonths"),
                                grams: t("units.grams"),
                                months: t("units.months"),
                            }}
                        />
                    </div>
                ) : activeTab === "reviews" ? (
                    <ProductReviews {...reviews}/>
                ) : (
                    <div className="max-w-[1144px] pt-12">
                        {activeTab === "warranty" ? (
                            <ProductInfoBlock href={routes.guarantee()} linkLabel={t("tabs.detailsLink")}>
                                <Heading as="h2" size="bodyLg" weight="medium" colors="primary" className="leading-normal">
                                    {t("tabs.warrantyInfo.title")}
                                </Heading>
                                <ProductInfoParagraph className="mt-[30px]">
                                    {t("tabs.warrantyInfo.description")}
                                </ProductInfoParagraph>
                            </ProductInfoBlock>
                        ) : null}

                        {activeTab === "delivery" ? (
                            <ProductInfoBlock href={routes.delivery()} linkLabel={t("tabs.detailsLink")}>
                                <ProductInfoParagraph>
                                    {rich("tabs.deliveryInfo.paragraph1")}
                                </ProductInfoParagraph>
                                <ProductInfoParagraph className="mt-[30px]">
                                    {t("tabs.deliveryInfo.paragraph2")}
                                </ProductInfoParagraph>
                                <ProductInfoParagraph className="mt-[30px]">
                                    {t("tabs.deliveryInfo.paragraph3")}
                                </ProductInfoParagraph>
                            </ProductInfoBlock>
                        ) : null}

                        {activeTab === "payment" ? (
                            <ProductInfoBlock href={routes.payment()} linkLabel={t("tabs.detailsLink")}>
                                <ProductInfoParagraph>
                                    {rich("tabs.paymentInfo.paragraph1")}
                                </ProductInfoParagraph>
                                <ProductInfoParagraph className="mt-[30px]">
                                    {t("tabs.paymentInfo.paragraph2")}
                                </ProductInfoParagraph>
                                <ul className="mt-[30px] list-disc pl-6">
                                    {paymentMethodKeys.map((key) => (
                                        <li key={key}>
                                            <ProductInfoParagraph>
                                                {rich(`tabs.paymentInfo.methods.${key}`)}
                                            </ProductInfoParagraph>
                                        </li>
                                    ))}
                                </ul>
                            </ProductInfoBlock>
                        ) : null}
                    </div>
                )}
            </div>
        </section>
    );
};

export default ProductInfoTabs;

function ProductInfoParagraph({
                                  children,
                                  className,
                              }: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <Text colors="primary" size="bodyLg" weight="light" className={cn("whitespace-pre-line leading-normal", className)}>
            {children}
        </Text>
    );
}

function ProductInfoBlock({
                              children,
                              href,
                              linkLabel,
                          }: {
    children: ReactNode;
    href: string;
    linkLabel: string;
}) {
    return (
        <div>
            {children}
            <Link
                href={href}
                className="mt-10 inline-flex min-h-11 items-center gap-4 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40"
            >
                <Text as="span" size="bodyLg" weight="medium" colors="headingSecondary" className="leading-none">
                    {linkLabel}
                </Text>
                <ArrowRight className="h-auto w-6" aria-hidden="true"/>
            </Link>
        </div>
    );
}

function getPublicBrandByName(brandName?: string | null) {
    if (!brandName) {
        return undefined;
    }

    const normalizedBrandName = normalizeBrandLookup(brandName);

    return PUBLIC_BRANDS.find((brand) => (
        brand.matchingNames.some((name) => normalizeBrandLookup(name) === normalizedBrandName)
    ));
}
