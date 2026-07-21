import React from 'react';

import CatalogPage from "@/screens/CatalogPage";
import {LocaleEnum} from "@/i18n/routing";
import {normalizeCatalogQueryValue} from "@/utils/catalogFilterParams";
import {loadCatalogCategory} from "./loadCatalogCategory";

export const dynamic = "force-dynamic";

type Props = {
    params: Promise<{
        locale: LocaleEnum;
    }>;
    searchParams: Promise<{
        categoryCode?: string | string[];
    }>;
};

export default async function Page({ params, searchParams }: Props) {
    const { locale } = await params;
    const {categoryCode} = await searchParams;
    const selectedCategoryCode = normalizeCatalogQueryValue(
        Array.isArray(categoryCode) ? categoryCode[0] : categoryCode
    ) ?? undefined;
    const initialCategory = await loadCatalogCategory(selectedCategoryCode, locale);

    return (
        <CatalogPage
            categoryCode={selectedCategoryCode}
            locale={locale}
            initialCategory={initialCategory}
        />
    );
}
