"use client";

import {usePathname, useSearchParams} from "next/navigation";
import {useProgressRouter} from "@/hooks/useProgressRouter";
import {catalogSortSearch, effectiveCatalogSort, explicitCatalogSort} from "@/lib/catalogSort";

export function useSort() {
    const router = useProgressRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const params = new URLSearchParams(searchParams?.toString());
    const setSort = (sort?: string) => {
        const query = catalogSortSearch(new URLSearchParams(searchParams?.toString()), sort).toString();
        router.push(query ? `${pathname}?${query}` : pathname ?? "", {scroll: false});
    };
    return {sort: effectiveCatalogSort(params), hasExplicitSort: Boolean(explicitCatalogSort(params)), setSort};
}
