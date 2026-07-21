"use client";

import {useMemo} from "react";

import {Page} from "@/api/types/PageType";
import {Text} from "@/components/ui/shared/text";
import {usePagination} from "@/hooks/usePagination";
import {cn} from "@/lib/utils";
import {useTranslations} from "use-intl";

type Props = {
    pageData: Page<unknown>;
}

const MAX_VISIBLE_PAGES = 5;

const Pagination = ({pageData}: Props) => {
    const t = useTranslations("pagination");
    const {page, size, setPage} = usePagination({
        scrollTargetId: "catalog-product-list",
    });

    const currentPage = Math.min(Math.max(page, 1), Math.max(pageData.totalPages, 1));

    const visiblePages = useMemo(() => {
        if (pageData.totalPages <= MAX_VISIBLE_PAGES) {
            return Array.from({length: pageData.totalPages}, (_, index) => index + 1);
        }

        const half = Math.floor(MAX_VISIBLE_PAGES / 2);
        const startPage = Math.min(
            Math.max(currentPage - half, 1),
            pageData.totalPages - MAX_VISIBLE_PAGES + 1
        );

        return Array.from({length: MAX_VISIBLE_PAGES}, (_, index) => startPage + index);
    }, [currentPage, pageData.totalPages]);

    const getRangeLabel = (pageNumber: number) => {
        const startIndex = (pageNumber - 1) * size;
        const endIndex = Math.min(startIndex + size - 1, Math.max(pageData.totalElements - 1, 0));

        return `${startIndex}-${endIndex}`;
    };

    const renderPaginationButton = (pageNumber: number) => {
        const isActive = pageNumber === currentPage;

        return (
            <button
                key={pageNumber}
                type="button"
                onClick={() => setPage(pageNumber)}
                aria-label={t("page", {page: pageNumber})}
                aria-current={isActive ? "page" : undefined}
                disabled={isActive}
                className={cn(
                    "flex h-11 min-w-11 cursor-pointer items-center justify-center rounded-full border px-3 transition",
                    "hover:border-text-heading-primary hover:bg-surface-card",
                    "disabled:cursor-default",
                    isActive
                        ? "border-text-heading-primary bg-button-bg-action text-text-inverse hover:text-text-heading-secondary"
                        : "border-border-default bg-primary-bg text-text-heading-secondary"
                )}
            >
                <Text
                    size="bodyLg"
                    font="sans"
                    weight={isActive ? "semibold" : "regular"}
                    colors={isActive ? "inverse" : "headingSecondary"}
                    className="leading-none transition"
                >
                    {pageNumber}
                </Text>
            </button>
        );
    };

    if (pageData.totalPages <= 1) {
        return null;
    }

    return (
        <div className="mt-21">
            <nav aria-label={t("aria")} className="w-full overflow-hidden">
                <div className="flex w-full min-w-0 flex-nowrap items-center justify-between gap-4 sm:gap-7">
                    <div className="catalog-filter-scroll min-w-0 flex-1 overflow-x-auto overflow-y-hidden pb-2">
                        <div className="flex w-max flex-nowrap items-center gap-3 sm:gap-7">
                            {visiblePages.map((pageNumber) => {
                                const isActive = pageNumber === currentPage;

                                return (
                                    <button
                                        key={`range-${pageNumber}`}
                                        type="button"
                                        onClick={() => setPage(pageNumber)}
                                        aria-label={t("items", {range: getRangeLabel(pageNumber)})}
                                        disabled={isActive}
                                        className={cn(
                                            "cursor-pointer rounded-full border px-4 py-2 transition",
                                            "hover:border-text-heading-primary hover:bg-surface-card",
                                            "disabled:cursor-default",
                                            isActive
                                                ? "border-text-heading-primary bg-button-bg-action"
                                                : "border-transparent bg-transparent"
                                        )}
                                    >
                                        <Text
                                            size="bodyLg"
                                            font="sans"
                                            weight={isActive ? "semibold" : "regular"}
                                            colors={isActive ? "inverse" : "headingSecondary"}
                                            className="leading-none transition"
                                        >
                                            {getRangeLabel(pageNumber)}
                                        </Text>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="catalog-filter-scroll ml-auto min-w-0 flex-1 overflow-x-auto overflow-y-hidden pb-2">
                        <div className="flex w-max min-w-full flex-nowrap items-center justify-end gap-3">
                            {visiblePages.map(renderPaginationButton)}

                            {visiblePages.at(-1) !== pageData.totalPages && (
                                <>
                                    <Text
                                        size="bodyLg"
                                        font="sans"
                                        weight="regular"
                                        colors="secondary"
                                        className="leading-none"
                                    >
                                        ...
                                    </Text>

                                    {renderPaginationButton(pageData.totalPages)}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
        </div>
    );
};

export default Pagination;
