import React from 'react';
import CatalogPage from "@/screens/CatalogPage";
import {LocaleEnum} from "@/i18n/routing";
import {loadCatalogCategory} from "../loadCatalogCategory";
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
        slug: string[];
        locale: LocaleEnum;
    }>;
    searchParams: Promise<NextSearchParams>;
};

export async function generateMetadata({params, searchParams}: Props) {
    const {locale, slug} = await params;
    if (slug.length !== 1) return {robots: {index: false, follow: false}};
    const policy = classifyCatalogUrl(slug[0], toUrlSearchParams(await searchParams));
    const category = await loadCatalogCategory(policy.categoryCode, locale);
    const content = category ? categorySeoContent(locale, category.name) : staticSeoContent(locale, "catalog");
    return publicSeoMetadata(locale, ["catalog", policy.categoryCode ?? slug[0]], content, {
        indexable: policy.indexable && Boolean(category),
        canonicalSearch: policy.canonicalSearch,
    });
}

export default async function Page({ params, searchParams }: Props) {
    const { slug, locale } = await params;
    if (slug.length !== 1) notFound();
    const rawSearchParams = toUrlSearchParams(await searchParams);
    const policy = classifyCatalogUrl(slug[0], rawSearchParams);
    if (policy.redirectRequired) {
        permanentRedirect(routes.withLocale(locale, catalogHrefFromPolicy(policy)));
    }
    const categoryCode = policy.categoryCode;
    const [initialCategory, initialData] = await Promise.all([
        loadCatalogCategory(categoryCode, locale),
        loadCatalogPageData(catalogRequestParams(locale, categoryCode, new URLSearchParams(policy.normalizedSearch))),
    ]);
    if (initialData.status === "out_of_range") notFound();
    if (initialData.status === "transient_error") console.error(initialData.error);
    const catalogT = await getTranslations("catalog");
    const siteUrl = isSiteIndexingEnabled() ? requireCanonicalSiteUrl() : null;
    const jsonLd = siteUrl && policy.indexable
        ? catalogBreadcrumbJsonLd(
            initialCategory,
            locale,
            siteUrl,
            new URL(localizedPath(locale, ["catalog", categoryCode ?? slug[0]]), siteUrl).toString(),
            {home: catalogT("home"), allGoods: catalogT("allGoods")},
        )
        : null;

    return (
        <>
        {jsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{__html: jsonLd}}/> : null}
        <CatalogPage
            categoryCode={categoryCode}
            locale={locale}
            initialCategory={initialCategory}
            initialProducts={initialData.status === "success" ? initialData.page : null}
            initialProductsError={initialData.status === "transient_error"}
            initialQueryKey={catalogHrefFromPolicy(policy)}
        />
        </>
    );
}

