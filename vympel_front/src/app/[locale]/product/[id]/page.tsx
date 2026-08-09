import React from "react";
import {notFound} from "next/navigation";

import ProductPage, {buildProductBreadcrumbs} from "@/screens/ProductPage";
import {LocaleEnum} from "@/i18n/routing";
import {localizedPath, privatePageMetadata, publicSeoMetadata, requireCanonicalSiteUrl} from "@/lib/seo";
import {productSeoContent, staticSeoContent} from "@/lib/seoContent";
import {loadProductPageData} from "@/lib/productPageData";
import {isSiteIndexingEnabled} from "@/lib/siteIndexing";
import {buildBreadcrumbStructuredData, buildProductStructuredData, serializeJsonLd} from "@/lib/structuredData";
import {getTranslations} from "next-intl/server";
import {routes} from "@/config/routes";

export const dynamic = "force-dynamic";

type Props = {
    params: Promise<{
        id: string;
        locale: LocaleEnum;
    }>;
};

export async function generateMetadata({params}: Props) {
    const {locale, id} = await params;
    const result = await loadProductPageData(id, locale);
    if (result.status === "not_found") notFound();
    if (result.status !== "success") {
        const content = staticSeoContent(locale, "productUnavailable");
        return {...privatePageMetadata(content.title), description: content.description};
    }
    const primaryImage = [...(result.product.images ?? [])]
        .sort((left, right) => Number(right.isMain) - Number(left.isMain) || left.sortOrder - right.sortOrder)[0];
    return publicSeoMetadata(locale, ["product", id], productSeoContent(locale, result.product), {
        imageUrl: primaryImage?.url,
        imageAlt: primaryImage?.alt || result.product.name,
    });
}

export default async function Page({params}: Props) {
    const {id, locale} = await params;
    const result = await loadProductPageData(id, locale);
    if (result.status === "not_found") notFound();
    if (result.status === "transient_error" && result.error) console.error(result.error);
    const product = result.status === "success" ? result.product : null;
    const productLoadError = result.status !== "success";
    let jsonLd: string | null = null;
    if (product && isSiteIndexingEnabled()) {
        const siteUrl = requireCanonicalSiteUrl();
        const canonicalUrl = new URL(localizedPath(locale, ["product", id]), siteUrl).toString();
        const catalogT = await getTranslations("catalog");
        const breadcrumbs = buildProductBreadcrumbs(product, {
            home: catalogT("home"),
            catalog: catalogT("allGoods"),
        }).map((breadcrumb) => ({
            name: breadcrumb.label,
            url: breadcrumb.href
                ? new URL(routes.withLocale(locale, breadcrumb.href), siteUrl).toString()
                : canonicalUrl,
        }));
        jsonLd = serializeJsonLd([
            buildProductStructuredData(product, canonicalUrl),
            buildBreadcrumbStructuredData(breadcrumbs),
        ]);
    }

    return (
        <>
            {jsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{__html: jsonLd}}/> : null}
            <ProductPage
                productId={id}
                locale={locale}
                initialProduct={product}
                productLoadError={productLoadError}
            />
        </>
    );
}
