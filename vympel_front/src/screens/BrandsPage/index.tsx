import {getTranslations} from "next-intl/server";

import {PublicApiController} from "@/api/controllers/PublicController";
import type {ICatalogFilterOption} from "@/api/types/ProductTypes";
import Navigation from "@/components/ui/layout/Navigation";
import EmptyState from "@/components/ui/shared/EmptyState";
import {Text} from "@/components/ui/shared/text";
import {Heading} from "@/components/ui/shared/text/Heading";
import {Link} from "@/i18n/navigation";
import {LocaleEnum} from "@/i18n/routing";
import {PUBLIC_BRANDS, normalizeBrandLookup, type PublicBrand} from "@/config/brandRoutes";
import {routes} from "@/config/routes";
import {PUBLIC_BREADCRUMB_SEPARATOR} from "@/config/publicBreadcrumb";

type Props = {
    locale: LocaleEnum;
};

type BrandListItem = {
    brand: PublicBrand;
    count?: number;
};

const BrandsPage = async ({locale}: Props) => {
    const t = await getTranslations({locale, namespace: "brandsPage"});
    const catalogT = await getTranslations({locale, namespace: "catalog"});
    const stateT = await getTranslations({locale, namespace: "states"});
    let brandOptions: ICatalogFilterOption[] | null = null;

    try {
        const filters = await PublicApiController.getCatalogFilters(locale);
        brandOptions = filters?.filters.find((filter) => filter.key === "brand")?.options ?? null;
    } catch (error) {
        console.error(error);
    }

    const brands = buildBrandList(brandOptions);

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
                    <Text as="span" colors="primary" size="bodyLg" weight="light" className="shrink-0 text-breadcrumb leading-none">
                        {t("title")}
                    </Text>
                </nav>

                <section className="pt-brand-title-offset" aria-labelledby="brands-page-title">
                    <Heading
                        id="brands-page-title"
                        as="h1"
                        size="h1"
                        weight="regular"
                        className="brand-page-title text-center leading-tight uppercase text-text-heading-primary lg:leading-none"
                    >
                        {t("title")}
                    </Heading>

                    {brands.length ? (
                        <ul className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3">
                            {brands.map((item) => (
                                <li key={item.brand.slug}>
                                    <Link
                                        href={routes.brand(item.brand.slug)}
                                        aria-label={t("openBrand", {brand: item.brand.displayName})}
                                        className="flex h-full min-h-36 flex-col justify-between rounded-2xl border border-border-default bg-surface-card px-6 py-5 transition-vympel-fast hover:border-text-heading-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40"
                                    >
                                        <Text
                                            as="span"
                                            size="bodyXl"
                                            weight="medium"
                                            colors="headingPrimary"
                                            className="product-long-copy leading-tight uppercase"
                                        >
                                            {item.brand.displayName}
                                        </Text>
                                        {item.count != null ? (
                                            <Text as="span" size="bodySm" colors="muted" className="mt-6">
                                                {t("brandCount", {count: item.count})}
                                            </Text>
                                        ) : null}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState
                            visual="catalog"
                            title={t("emptyTitle")}
                            description={t("emptyDescription")}
                            action={{
                                label: stateT("actions.goCatalog"),
                                href: routes.catalog({page: 1}),
                            }}
                            className="mt-12"
                        />
                    )}
                </section>
            </div>
        </main>
    );
};

export default BrandsPage;

function buildBrandList(options: ICatalogFilterOption[] | null): BrandListItem[] {
    if (!options) {
        return PUBLIC_BRANDS.map((brand) => ({
            brand,
        }));
    }

    return PUBLIC_BRANDS.map((brand) => ({
        brand,
        count: options.find((option) => matchesPublicBrand(brand, option.label))?.count ?? 0,
    }));
}

function matchesPublicBrand(brand: PublicBrand, label: string) {
    const normalizedLabel = normalizeBrandLookup(label);

    return brand.matchingNames.some((name) => normalizeBrandLookup(name) === normalizedLabel);
}
