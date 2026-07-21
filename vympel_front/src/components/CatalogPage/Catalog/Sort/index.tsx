"use client";

import {FC, useEffect, useRef} from "react";
import {X} from "lucide-react";
import {useForm} from "react-hook-form";
import {useTranslations} from "use-intl";

import SortIcon from "@/assets/icons/SortIcon";
import {RadioGroup} from "@/components/form/RadioGroup";
import {Text} from "@/components/ui/shared/text";
import {SortValue} from "@/components/CatalogPage/Catalog/Sort/type";
import {sortOptions} from "@/components/CatalogPage/Catalog/Sort/config";
import {cn} from "@/lib/utils";
import {useSort} from "@/hooks/useSort";
import CatalogMobileSheet, {useIsMobileViewport} from "@/components/CatalogPage/CatalogMobileSheet";
import {useCatalogOverlay} from "@/components/CatalogPage/CatalogOverlayProvider";

type FormValues = {
    sort: string;
};

const Sort: FC = () => {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const t = useTranslations("catalog.sort");
    const {activeOverlay, closeOverlay, openOverlay} = useCatalogOverlay();
    const isMobileViewport = useIsMobileViewport();
    const {sort, setSort} = useSort<SortValue>({
        defaultSort: "priceAsc",
    });
    const {control, reset} = useForm<FormValues>({
        defaultValues: {
            sort,
        },
    });
    const isVisible = activeOverlay === "sorting";
    const isMobileVisible = isVisible;
    const activeOption = sortOptions.find((option) => option.value === sort) ?? sortOptions[0];

    useEffect(() => {
        reset({sort});
    }, [reset, sort]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                window.matchMedia("(min-width: 1024px)").matches
                && !rootRef.current?.contains(event.target as Node)
            ) {
                closeOverlay("sorting");
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [closeOverlay]);

    const handleSortChange = (nextSort: SortValue) => {
        closeOverlay("sorting");

        if (nextSort !== sort) {
            setSort(nextSort);
        }
    };

    const radioOptions = sortOptions.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
    }));

    return (
        <div ref={rootRef} className="lg:static">
            <button
                type="button"
                aria-expanded={isMobileVisible}
                aria-haspopup="dialog"
                aria-label={`${t("trigger")}: ${t(activeOption.shortLabelKey)}`}
                className="flex min-h-12 min-w-12 cursor-pointer items-center justify-center rounded-full border border-border-default p-0 transition-vympel-fast focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40 min-[1440px]:hidden"
                onClick={(event) => {
                    if (isMobileVisible) {
                        closeOverlay("sorting");
                    } else {
                        openOverlay("sorting", event.currentTarget);
                    }
                }}
            >
                <SortIcon className="size-5 shrink-0"/>
            </button>

            <button
                type="button"
                aria-expanded={isVisible}
                aria-haspopup="listbox"
                aria-label={`${t("trigger")}: ${t(activeOption.shortLabelKey)}`}
                className="hidden min-h-0 w-fit cursor-pointer items-center justify-start gap-5 border-0 px-0 py-0 transition-vympel-fast focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40 min-[1440px]:flex"
                onClick={(event) => {
                    if (isVisible) {
                        closeOverlay("sorting");
                    } else {
                        openOverlay("sorting", event.currentTarget);
                    }
                }}
            >
                <SortIcon className="size-8"/>
                <Text size="bodyXl" colors="headingSecondary" className="min-w-0 text-center leading-tight">
                    {t(activeOption.shortLabelKey)}
                </Text>
            </button>

            <CatalogMobileSheet
                open={isMobileVisible}
                title={t("trigger")}
                onOpenChange={(open) => {
                    if (!open) closeOverlay("sorting");
                }}
            >
                <header className="flex min-h-16 items-center justify-between gap-4 border-b border-border-default px-5">
                    <Text as="h2" size="bodyLg" weight="medium" colors="headingPrimary">
                        {t("trigger")}
                    </Text>
                    <button
                        type="button"
                        aria-label={t("close")}
                        className="inline-flex size-11 items-center justify-center rounded-full transition-vympel-fast focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40"
                        onClick={() => closeOverlay("sorting")}
                    >
                        <X className="size-5" aria-hidden="true"/>
                    </button>
                </header>
                <form className="catalog-mobile-sort-options min-h-0 overflow-y-auto px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3">
                    <RadioGroup<FormValues, SortValue>
                        name="sort"
                        control={control}
                        options={radioOptions}
                        direction="column"
                        className="items-stretch gap-1"
                        onValueChange={handleSortChange}
                    />
                </form>
            </CatalogMobileSheet>

            {!isMobileViewport ? (
                <form
                    aria-hidden={!isVisible}
                    className={cn(
                        "catalog-toolbar-panel catalog-toolbar-panel-wide absolute top-full z-20 hidden max-h-none w-full origin-top rounded-bl-2xl rounded-br-2xl border bg-primary-bg px-9 py-7 transition-vympel motion-reduce:transition-none lg:block",
                        !isVisible && "pointer-events-none invisible -translate-y-1 opacity-0 motion-reduce:translate-y-0",
                        isVisible && "visible translate-y-0 opacity-100"
                    )}
                >
                    <RadioGroup<FormValues, SortValue>
                        name="sort"
                        control={control}
                        options={radioOptions}
                        direction="column"
                        className="items-center justify-between gap-4 lg:flex-row"
                        onValueChange={handleSortChange}
                    />
                </form>
            ) : null}
        </div>
    );
};

export default Sort;
