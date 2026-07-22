"use client";

import {FC, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {ListTree} from "lucide-react";
import {useSearchParams} from "next/navigation";
import {useTranslations} from "use-intl";

import {ICategory} from "@/api/types/CategoryTypes";
import {PublicApiController} from "@/api/controllers/PublicController";
import {LocaleEnum} from "@/i18n/routing";
import {useRouter} from "@/i18n/navigation";
import {Text} from "@/components/ui/shared/text";
import {cn} from "@/lib/utils";
import {routes} from "@/config/routes";
import {buildCategoryTree, CategoryNode, normalizeCategoryCode} from "@/utils/categoryTree";
import {useCatalogOverlay} from "@/components/CatalogPage/CatalogOverlayProvider";
import {CATALOG_TOOLBAR_CONTROL_HEIGHT_CLASS} from "@/components/CatalogPage/CatalogOverlayProvider/state";

type Props = {
    locale: LocaleEnum;
    categoryCode?: string;
};

const CategorySelector: FC<Props> = ({locale, categoryCode}) => {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const hoverIntentRef = useRef<number | null>(null);
    const t = useTranslations("catalog.categories");
    const router = useRouter();
    const searchParams = useSearchParams();
    const {activeOverlay, closeOverlay, openOverlay} = useCatalogOverlay();
    const [categories, setCategories] = useState<ICategory[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [hoveredParentId, setHoveredParentId] = useState<number | null>(null);

    const normalizedSelectedCode = normalizeCategoryCode(categoryCode);
    const isVisible = activeOverlay === "categories";
    const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
    const categoryById = useMemo(
        () => new Map(categories.map((category) => [category.id, category])),
        [categories]
    );
    const selectedCategory = useMemo(() => (
        categories.find((category) => normalizeCategoryCode(category.code) === normalizedSelectedCode)
    ), [categories, normalizedSelectedCode]);
    const selectedRootId = useMemo(() => {
        if (!selectedCategory) {
            return null;
        }

        let current: ICategory | undefined = selectedCategory;

        while (current?.parentId != null) {
            current = categoryById.get(current.parentId);
        }

        return current?.id ?? null;
    }, [categoryById, selectedCategory]);
    const activeRoot = categoryTree.find((node) => node.id === (hoveredParentId ?? selectedRootId))
        ?? categoryTree[0]
        ?? null;

    useEffect(() => {
        let cancelled = false;

        const loadCategories = async () => {
            setLoading(true);
            setError(false);

            try {
                const response = await PublicApiController.getCategoryList(locale);
                if (cancelled) return;
                setCategories(response);
            } catch {
                if (cancelled) return;
                setCategories([]);
                setError(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void loadCategories();

        return () => {
            cancelled = true;
        };
    }, [locale]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                window.matchMedia("(min-width: 1024px)").matches
                && !rootRef.current?.contains(event.target as Node)
            ) {
                closeOverlay("categories");
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [closeOverlay]);

    useEffect(() => {
        return () => {
            if (hoverIntentRef.current !== null) {
                window.clearTimeout(hoverIntentRef.current);
            }
        };
    }, []);

    const activateRoot = useCallback((categoryId: number) => {
        if (hoverIntentRef.current !== null) {
            window.clearTimeout(hoverIntentRef.current);
        }

        hoverIntentRef.current = window.setTimeout(() => {
            setHoveredParentId(categoryId);
        }, 70);
    }, []);

    const selectCategory = (category?: ICategory) => {
        closeOverlay("categories");
        router.push(routes.categorySelectionCatalog(category?.code, searchParams), {scroll: false});
    };

    const renderCategoryButton = (category: CategoryNode, level: "root" | "child") => {
        const isActive = normalizeCategoryCode(category.code) === normalizedSelectedCode;
        const hasChildren = category.children.length > 0;

        return (
            <button
                key={category.id}
                type="button"
                data-active={isActive ? "true" : undefined}
                className={cn(
                    "catalog-hover-trigger min-h-10 rounded-full border border-border-default px-3 py-2 text-left text-sm text-catalog-filter-category transition-vympel-fast hover:text-text-heading-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/30 motion-reduce:transition-none lg:min-h-0 lg:w-full lg:rounded-sm lg:border-0 lg:px-1",
                    level === "root" && "flex items-center justify-between gap-3",
                    level === "root" && "shrink-0 lg:shrink",
                    isActive && "bg-surface-card font-semibold lg:bg-transparent"
                )}
                onMouseEnter={() => level === "root" && activateRoot(category.id)}
                onFocus={() => level === "root" && setHoveredParentId(category.id)}
                onClick={() => selectCategory(category)}
            >
                <span className="catalog-hover-label" data-active={isActive ? "true" : undefined}>
                    {category.name}
                </span>
                {hasChildren && level === "root" ? <span aria-hidden="true">&gt;</span> : null}
            </button>
        );
    };

    return (
        <div ref={rootRef} className="relative lg:static">
            <button
                type="button"
                aria-expanded={activeOverlay === "categories"}
                aria-haspopup="dialog"
                aria-label={t("trigger")}
                className="flex size-12 min-h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-border-default transition-vympel-fast focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40 min-[1440px]:hidden"
                onClick={(event) => {
                    if (activeOverlay === "categories") {
                        closeOverlay("categories");
                    } else {
                        openOverlay("categories", event.currentTarget);
                    }
                }}
            >
                <ListTree className="size-5 text-catalog-filter-trigger" aria-hidden="true"/>
            </button>

            <button
                type="button"
                aria-expanded={isVisible}
                aria-haspopup="listbox"
                className={cn(
                    "hidden w-fit cursor-pointer items-center justify-start gap-catalog-filter-trigger-gap border-0 px-0 py-0 transition-vympel-fast focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40 min-[1440px]:flex",
                    CATALOG_TOOLBAR_CONTROL_HEIGHT_CLASS
                )}
                onClick={(event) => {
                    if (isVisible) {
                        closeOverlay("categories");
                    } else {
                        openOverlay("categories", event.currentTarget);
                    }
                }}
            >
                <ListTree className="size-8 text-catalog-filter-trigger" aria-hidden="true"/>
                <Text as="span" size="bodyXl" colors="headingSecondary" className="min-w-0 text-center leading-tight">
                    {selectedCategory?.name ?? t("trigger")}
                </Text>
            </button>

            <div
                aria-hidden={!isVisible}
                className={cn(
                    "catalog-toolbar-panel catalog-toolbar-panel-wide absolute top-full z-30 hidden max-h-none w-full origin-top rounded-bl-2xl rounded-br-2xl border bg-primary-bg transition-vympel motion-reduce:transition-none lg:block",
                    {"pointer-events-none invisible -translate-y-1 opacity-0 motion-reduce:translate-y-0": !isVisible},
                    {"visible translate-y-0 opacity-100": isVisible},
                )}
            >
                <div className="box-border max-h-catalog-filter-panel-max overflow-hidden px-catalog-filter-panel-padding-x py-catalog-filter-panel-padding-y">
                    {loading && <Text size="bodySm">{t("loading")}</Text>}
                    {error && <Text size="bodySm" className="text-error">{t("error")}</Text>}

                    {!loading && !error ? (
                        <div className="grid max-h-catalog-filter-panel-content min-h-0 grid-cols-[minmax(180px,280px)_minmax(0,1fr)] gap-10 overflow-hidden">
                            <div className="catalog-filter-scroll flex min-h-0 shrink-0 flex-col gap-5 overflow-y-auto overflow-x-visible border-r border-border-default pr-10">
                                <button
                                    type="button"
                                    data-active={!selectedCategory ? "true" : undefined}
                                    className={cn(
                                        "catalog-hover-trigger min-h-10 shrink-0 rounded-full border border-border-default px-3 py-2 text-left text-sm text-catalog-filter-category transition-vympel-fast hover:text-text-heading-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/30 motion-reduce:transition-none lg:min-h-0 lg:w-full lg:rounded-sm lg:border-0 lg:px-1",
                                        !selectedCategory && "bg-surface-card font-semibold lg:bg-transparent"
                                    )}
                                    onClick={() => selectCategory()}
                                >
                                    <span className="catalog-hover-label" data-active={!selectedCategory ? "true" : undefined}>
                                        {t("all")}
                                    </span>
                                </button>
                                {categoryTree.map((category) => renderCategoryButton(category, "root"))}
                            </div>

                            <div className="catalog-filter-scroll min-h-0 overflow-y-auto">
                                {activeRoot?.children.length ? (
                                    <div
                                        key={activeRoot.id}
                                        className="vympel-submenu-motion grid grid-cols-3 gap-x-catalog-filter-option-x-gap gap-y-5"
                                    >
                                        {activeRoot.children.map((category) => renderCategoryButton(category, "child"))}
                                    </div>
                                ) : (
                                    <Text size="bodySm" colors="muted">{t("empty")}</Text>
                                )}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default CategorySelector;
