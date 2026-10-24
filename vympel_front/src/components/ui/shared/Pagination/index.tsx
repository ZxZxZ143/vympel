"use client";

import {useEffect, useRef, type CSSProperties} from "react";
import {Pagination as ArkPagination} from "@ark-ui/react/pagination";
import {ArrowLeft, ArrowRight} from "lucide-react";
import {useTranslations} from "use-intl";
import type {Page} from "@/api/types/PageType";
import {usePagination} from "@/hooks/usePagination";
import {Link} from "@/i18n/navigation";

const rangeClass = "flex h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-transparent px-4 text-base leading-none text-text-heading-secondary transition-vympel-fast hover:bg-surface-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-heading-primary data-[selected]:border-text-heading-primary data-[selected]:bg-button-bg-action data-[selected]:text-text-inverse data-[selected]:font-semibold";

const controlClass = "flex h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-border-default bg-primary-bg px-2 text-text-heading-secondary transition-vympel-fast hover:border-text-heading-primary hover:bg-surface-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-heading-primary data-[selected]:border-text-heading-primary data-[selected]:bg-button-bg-action data-[selected]:text-text-inverse data-[selected]:font-semibold";
const numericClass = `${controlClass} max-lg:size-[var(--pagination-mobile-size)] max-lg:min-w-[var(--pagination-mobile-size)] max-lg:px-0`;

type Props = {pageData: Page<unknown>; scrollTargetId?: string};

export default function Pagination({pageData, scrollTargetId}: Props) {
    const t = useTranslations("pagination");
    const {page, size, pageHref} = usePagination(pageData, scrollTargetId);
    const rangesRef = useRef<HTMLDivElement>(null);
    const pagesRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const revealActive = () => {
            for (const group of [rangesRef.current, pagesRef.current]) {
                const active = group?.querySelector<HTMLElement>('[aria-current="page"]');
                if (group && active && group.scrollWidth > group.clientWidth) {
                    // Move only the horizontal scroller, never the document or keyboard focus.
                    group.scrollLeft += active.getBoundingClientRect().left - group.getBoundingClientRect().left
                        - (group.clientWidth - active.offsetWidth) / 2;
                }
            }
        };
        revealActive();
        const observer = new ResizeObserver(revealActive);
        for (const group of [rangesRef.current, pagesRef.current]) if (group) observer.observe(group);
        return () => observer.disconnect();
    }, [page, size, pageData.totalElements]);
    if (pageData.totalPages <= 1) return null;

    return (
        <ArkPagination.Root
            className="mt-21 flex w-full min-w-0 flex-col items-center gap-4 lg:flex-row lg:justify-between"
            count={pageData.totalElements} pageSize={size} page={page}
            siblingCount={1} boundaryCount={1}
            type="link" getPageUrl={({page: target}) => pageHref(target)}
            translations={{rootLabel: t("aria"), prevTriggerLabel: t("previous"),
                nextTriggerLabel: t("next"), itemLabel: ({page: target}) => t("page", {page: target})}}
        >
            <ArkPagination.Context>
                {(pagination) => {
                    // Both groups render Ark's complete page/ellipsis model.
                    // This is only a CSS space budget, not another page-window calculation.
                    const numberCount = pagination.pages.filter((item) => item.type === "page").length;
                    const ellipsisCount = pagination.pages.length - numberCount;
                    const mobileSpacing = ellipsisCount * 8 + (pagination.pages.length - 1) * 2 + 8;
                    const mobileStyle = {
                        "--pagination-mobile-size": `min(44px, calc((100cqw - ${mobileSpacing}px) / ${numberCount}))`,
                    } as CSSProperties;
                    return <>
                    <div ref={rangesRef} role="group" aria-label={t("ranges")}
                         data-pagination-group="ranges" className="catalog-filter-scroll hidden w-full min-w-0 overflow-x-auto lg:block lg:w-auto lg:flex-1">
                        <div className="flex w-full flex-wrap items-center gap-1 p-1 sm:gap-2 lg:w-max lg:flex-nowrap">
                            {pagination.pages.map((item, index) => {
                                if (item.type === "ellipsis") {
                                    return <ArkPagination.Ellipsis key={`range-ellipsis-${index}`} index={index}
                                        id={`${pagination.getEllipsisProps({index}).id}-range`}
                                        className="flex h-11 w-4 shrink-0 items-center justify-center text-text-heading-secondary"
                                        aria-hidden="true">…</ArkPagination.Ellipsis>;
                                }
                                const first = (item.value - 1) * pagination.pageSize + 1;
                                const last = Math.min(item.value * pagination.pageSize, pagination.count);
                                const label = first === last ? String(first) : `${first}–${last}`;
                                return <ArkPagination.Item key={item.value} {...item} asChild
                                    id={`${pagination.getItemProps(item).id}-range`}
                                    aria-label={t("items", {range: label})}>
                                    <Link href={pageHref(item.value)} prefetch={false} className={rangeClass}>{label}</Link>
                                </ArkPagination.Item>;
                            })}
                        </div>
                    </div>
                    <div ref={pagesRef} role="group" aria-label={t("pages")} data-pagination-group="pages"
                         className="catalog-filter-scroll w-full min-w-0 [container-type:inline-size] lg:w-auto lg:shrink-0 lg:overflow-x-auto lg:[container-type:normal]">
                    <div style={mobileStyle} className="mx-auto flex w-full flex-nowrap items-center justify-center gap-0.5 p-1 lg:w-max lg:gap-2 lg:justify-end">
                    {pagination.previousPage != null && <ArkPagination.PrevTrigger asChild>
                        <Link href={pageHref(pagination.previousPage)} prefetch={false} className={`${controlClass} hidden lg:flex`}>
                            <ArrowLeft className="size-4" aria-hidden="true"/>
                        </Link>
                    </ArkPagination.PrevTrigger>}
                    {pagination.pages.map((item, index) => item.type === "page" ? (
                        <ArkPagination.Item key={item.value} {...item} asChild>
                            <Link href={pageHref(item.value)} prefetch={false} className={numericClass}>{item.value}</Link>
                        </ArkPagination.Item>
                    ) : (
                        <ArkPagination.Ellipsis key={`ellipsis-${index}`} index={index}
                                                className="flex h-11 w-2 shrink-0 items-center justify-center lg:w-4" aria-hidden="true">…</ArkPagination.Ellipsis>
                    ))}
                    {pagination.nextPage != null && <ArkPagination.NextTrigger asChild>
                        <Link href={pageHref(pagination.nextPage)} prefetch={false} className={`${controlClass} hidden lg:flex`}>
                            <ArrowRight className="size-4" aria-hidden="true"/>
                        </Link>
                    </ArkPagination.NextTrigger>}
                    </div>
                    </div>
                    </>;
                }}
            </ArkPagination.Context>
        </ArkPagination.Root>
    );
}
