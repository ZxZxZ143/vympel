import React from 'react';
import CatalogPage from "@/screens/CatalogPage";
import {LocaleEnum} from "@/i18n/routing";
import {loadCatalogCategory} from "../loadCatalogCategory";

export const dynamic = "force-dynamic";

type Props = {
    params: Promise<{
        slug: string[];
        locale: LocaleEnum;
    }>;
};

export default async function Page({ params }: Props) {
    const { slug, locale } = await params;
    const categoryCode = slug.at(-1);
    const initialCategory = await loadCatalogCategory(categoryCode, locale);

    return (
        <CatalogPage
            categoryCode={categoryCode}
            locale={locale}
            initialCategory={initialCategory}
        />
    );
}

