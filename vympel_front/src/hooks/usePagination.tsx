"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const PAGE_SIZE = 9;

type UsePaginationOptions = {
    defaultPage?: number;
    pageParamName?: string;
    scrollOffset?: number;
    scrollTargetId?: string;
};

type UsePaginationReturn = {
    page: number;
    size: number;
    setPage: (page: number) => void;
};

function parsePositiveInt(value: string | null | undefined, fallback: number): number {
    if (!value) return fallback;

    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 1) {
        return fallback;
    }

    return parsed;
}

export function usePagination(
    options: UsePaginationOptions = {}
): UsePaginationReturn {
    const {
        defaultPage = 1,
        pageParamName = "page",
        scrollOffset = 88,
        scrollTargetId,
    } = options;

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const page = useMemo(() => {
        return parsePositiveInt(searchParams?.get(pageParamName), defaultPage);
    }, [searchParams, pageParamName, defaultPage]);

    const size = PAGE_SIZE;

    useEffect(() => {
        if (!searchParams?.has("size")) {
            return;
        }

        const params = new URLSearchParams(searchParams.toString());
        params.delete("size");

        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname ?? "", { scroll: false });
    }, [router, pathname, searchParams]);

    const scrollToTarget = useCallback(() => {
        if (!scrollTargetId || typeof window === "undefined") {
            return;
        }

        window.requestAnimationFrame(() => {
            const target = document.getElementById(scrollTargetId);

            if (!target) {
                return;
            }

            const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            const top = Math.max(target.getBoundingClientRect().top + window.scrollY - scrollOffset, 0);

            window.scrollTo({
                top,
                behavior: prefersReducedMotion ? "auto" : "smooth",
            });
        });
    }, [scrollOffset, scrollTargetId]);

    const updateParams = useCallback(
        (nextPage: number) => {
            const params = new URLSearchParams(searchParams?.toString());

            params.set(pageParamName, String(nextPage));
            params.delete("size");

            router.push(`${pathname}?${params.toString()}`, { scroll: false });
            scrollToTarget();
        },
        [router, pathname, searchParams, pageParamName, scrollToTarget]
    );

    const setPage = useCallback(
        (nextPage: number) => {
            const validPage = nextPage < 1 ? 1 : nextPage;
            updateParams(validPage);
        },
        [updateParams]
    );

    return {
        page,
        size,
        setPage,
    };
}
