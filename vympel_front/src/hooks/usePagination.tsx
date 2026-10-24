"use client";

import {useSearchParams} from "next/navigation";
import {usePathname} from "@/i18n/navigation";
import type {Page} from "@/api/types/PageType";
import {paginationHref} from "@/lib/paginationUrl";

/** The response owns current page and size; never infer brand size from catalog defaults. */
export function usePagination(pageData: Page<unknown>, scrollTargetId?: string) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    return {
        page: pageData.number + 1,
        size: pageData.size,
        pageHref: (page: number) => paginationHref(
            pathname, new URLSearchParams(searchParams?.toString()), page, scrollTargetId,
        ),
    };
}
