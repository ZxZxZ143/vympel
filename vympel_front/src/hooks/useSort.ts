"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type UseSortOptions<TSort extends string> = {
    defaultSort: TSort;
    sortParamName?: string;
    pageParamName?: string;
};

type UseSortReturn<TSort extends string> = {
    sort: TSort;
    setSort: (sort: TSort) => void;
};

function parseSortValue<TSort extends string>(
    value: string | null | undefined,
    defaultSort: TSort
): TSort {
    if (!value) {
        return defaultSort;
    }

    return value as TSort;
}

export function useSort<TSort extends string>(
    options: UseSortOptions<TSort>
): UseSortReturn<TSort> {
    const {
        defaultSort,
        sortParamName = "sort",
        pageParamName = "page",
    } = options;

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const sort = useMemo(() => {
        return parseSortValue(searchParams?.get(sortParamName), defaultSort);
    }, [searchParams, sortParamName, defaultSort]);

    const setSort = useCallback(
        (nextSort: TSort) => {
            const params = new URLSearchParams(searchParams?.toString());

            params.set(sortParamName, nextSort);
            params.set(pageParamName, "1");

            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        },
        [router, pathname, searchParams, sortParamName, pageParamName]
    );

    return {
        sort,
        setSort,
    };
}