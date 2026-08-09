import React from 'react';

import CatalogPage from "@/screens/CatalogPage";
import {LocaleEnum} from "@/i18n/routing";
import {normalizeCatalogQueryValue} from "@/utils/catalogFilterParams";
import {loadCatalogCategory} from "./loadCatalogCategory";
import {localizedPath, publicSeoMetadata, requireCanonicalSiteUrl} from "@/lib/seo";
import {categorySeoContent, staticSeoContent} from "@/lib/seoContent";
import {catalogHrefFromPolicy, classifyCatalogUrl} from "@/lib/catalogUrl";
import {catalogRequestParams, type NextSearchParams, toUrlSearchParams} from "@/lib/catalogQuery";
import {loadCatalogPageData} from "@/lib/catalogPageData";
import {notFound, permanentRedirect} from "next/navigation";
import {routes} from "@/config/routes";
import {isSiteIndexingEnabled} from "@/lib/siteIndexing";
import {catalogBreadcrumbJsonLd} from "@/lib/catalogStructuredData";
import {getTranslations} from "next-intl/server";

export const dynamic = "force-dynamic";

type Props = {
    params: Promise<{
        locale: LocaleEnum;
    }>;
    searchParams: Promise<NextSearchParams>;
};

export async function generateMetadata({params, searchParams}: Props) {
    const {locale} = await params;
    const policy = classifyCatalogUrl(undefined, toUrlSearchParams(await searchParams));
    const category = await loadCatalogCategory(policy.categoryCode, locale);
    const content = category
        ? categorySeoContent(locale, category.name)
        : staticSeoContent(locale, "catalog");
    return publicSeoMetadata(
        locale,
        policy.categoryCode ? ["catalog", policy.categoryCode] : ["catalog"],
        content,
        {
            indexable: policy.indexable && (!policy.categoryCode || Boolean(category)),
            canonicalSearch: policy.canonicalSearch,
        },
    );
}

export default async function Page({ params, searchParams }: Props) {
    const { locale } = await params;
    const rawSearchParams = toUrlSearchParams(await searchParams);
    const policy = classifyCatalogUrl(undefined, rawSearchParams);
    if (policy.redirectRequired) {
        permanentRedirect(routes.withLocale(locale, catalogHrefFromPolicy(policy)));
    }
    const selectedCategoryCode = normalizeCatalogQueryValue(policy.categoryCode) ?? undefined;
    const [initialCategory, initialData] = await Promise.all([
        loadCatalogCategory(selectedCategoryCode, locale),
        loadCatalogPageData(catalogRequestParams(locale, selectedCategoryCode, new URLSearchParams(policy.normalizedSearch))),
    ]);
    if (initialData.status === "out_of_range") notFound();
    if (initialData.status === "transient_error") console.error(initialData.error);
    const jsonLd = isSiteIndexingEnabled() && policy.indexable
        ? catalogBreadcrumbJsonLd(
            initialCategory,
            locale,
            requireCanonicalSiteUrl(),
            new URL(localizedPath(locale, policy.categoryCode ? ["catalog", policy.categoryCode] : ["catalog"]), requireCanonicalSiteUrl()).toString(),
            {home: (await getTranslations("catalog"))("home"), allGoods: (await getTranslations("catalog"))("allGoods")},
        )
        : null;

    return (
        <>
        {jsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{__html: jsonLd}}/> : null}
        <CatalogPage
            categoryCode={selectedCategoryCode}
            locale={locale}
            initialCategory={initialCategory}
            initialProducts={initialData.status === "success" ? initialData.page : null}
            initialProductsError={initialData.status === "transient_error"}
            initialQueryKey={catalogHrefFromPolicy(policy)}
        />
        </>
    );
}
