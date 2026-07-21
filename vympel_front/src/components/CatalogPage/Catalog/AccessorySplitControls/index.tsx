"use client";

import {FC} from "react";
import {useSearchParams} from "next/navigation";
import {useTranslations} from "use-intl";

import {useRouter} from "@/i18n/navigation";
import {SEEDED_FILTER_VALUES, routes} from "@/config/routes";
import {Text} from "@/components/ui/shared/text";
import {cn} from "@/lib/utils";
import {normalizeCatalogQueryValue, normalizeCatalogQueryValues} from "@/utils/catalogFilterParams";

type Props = {
    categoryCode?: string;
};

const ACCESSORY_GENDER_FILTERS = [
    {
        value: null,
        labelKey: "all",
    },
    {
        value: SEEDED_FILTER_VALUES.gender.women,
        labelKey: "woman",
    },
    {
        value: SEEDED_FILTER_VALUES.gender.men,
        labelKey: "man",
    },
] as const;

const AccessorySplitControls: FC<Props> = ({categoryCode}) => {
    const t = useTranslations("categories");
    const router = useRouter();
    const searchParams = useSearchParams();
    const selectedGenderValues = normalizeCatalogQueryValues(searchParams?.getAll("gender") ?? []);
    const activeGender = ACCESSORY_GENDER_FILTERS.find(
        (item) => item.value !== null && selectedGenderValues.includes(item.value)
    )?.value ?? null;

    return (
        <div className="accessory-segmented-control grid w-full min-w-0 grid-cols-3 rounded-full border border-border-default bg-primary-bg p-1 min-[1440px]:flex min-[1440px]:w-auto min-[1440px]:shrink-0 min-[1440px]:flex-nowrap min-[1440px]:items-center min-[1440px]:gap-10 min-[1440px]:border-0 min-[1440px]:bg-transparent min-[1440px]:p-0">
            {ACCESSORY_GENDER_FILTERS.map((item) => {
                const isActive = activeGender === item.value;

                return (
                    <button
                        key={item.value ?? "all"}
                        type="button"
                        aria-pressed={isActive}
                        data-active={isActive ? "true" : undefined}
                        className={cn(
                            "catalog-hover-trigger flex min-h-11 min-w-0 items-center justify-center rounded-full border border-transparent px-2 py-2 transition-vympel-fast focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40 motion-reduce:transition-none min-[1440px]:min-h-0 min-[1440px]:shrink-0 min-[1440px]:border-0 min-[1440px]:px-0 min-[1440px]:py-0",
                            isActive && "bg-button-bg-action min-[1440px]:bg-transparent"
                        )}
                        onClick={() => {
                            router.push(
                                accessoryGenderHref(
                                    searchParams,
                                    categoryCode,
                                    isActive ? null : item.value
                                ),
                                {scroll: false}
                            );
                        }}
                    >
                        <Text
                            as="span"
                            size="bodySm"
                            colors="headingSecondary"
                            className={cn(
                                "catalog-hover-label min-w-0 text-center leading-tight min-[1440px]:text-md",
                                isActive && "text-button-text-action min-[1440px]:text-catalog-filter-trigger"
                            )}
                            data-active={isActive ? "true" : undefined}
                        >
                            {t(item.labelKey)}
                        </Text>
                    </button>
                );
            })}
        </div>
    );
};

export default AccessorySplitControls;

function accessoryGenderHref(
    currentParams: ReturnType<typeof useSearchParams>,
    categoryCode: string | undefined,
    genderValue: string | null
) {
    const params = new URLSearchParams();
    const search = normalizeCatalogQueryValue(currentParams?.get("search"));
    const sort = normalizeCatalogQueryValue(currentParams?.get("sort"));
    const selectedCategoryCode = normalizeCatalogQueryValue(categoryCode ?? currentParams?.get("categoryCode"));

    if (selectedCategoryCode) {
        params.set("categoryCode", selectedCategoryCode);
    }

    if (search) {
        params.set("search", search);
    }

    if (sort) {
        params.set("sort", sort);
    }

    if (genderValue) {
        params.set("gender", genderValue);
    }

    params.set("page", "1");

    return routes.catalogFromSearchParams(params);
}
