"use client";

import {type MouseEvent as ReactMouseEvent, type ReactNode, useEffect, useMemo, useState} from "react";
import {
    Activity,
    Baby,
    ChevronLeft,
    ChevronRight,
    Clock,
    Clock3,
    Crown,
    Heart,
    Home,
    LayoutGrid,
    ListTree,
    Mars,
    PackageOpen,
    Shapes,
    ShoppingCart,
    Tags,
    Timer,
    Venus,
    Watch,
    Waves,
    X,
    type LucideIcon,
} from "lucide-react";
import {useLocale, useTranslations} from "use-intl";
import {useSearchParams} from "next/navigation";

import {ICategory} from "@/api/types/CategoryTypes";
import {PublicApiController} from "@/api/controllers/PublicController";
import {LocaleEnum} from "@/i18n/routing";
import {Link, usePathname, useRouter} from "@/i18n/navigation";
import ProfileUnavailableButton from "@/components/ui/layout/ProfileUnavailableButton";
import {Text} from "@/components/ui/shared/text";
import {cn} from "@/lib/utils";
import {routes} from "@/config/routes";
import {buildCategoryTree, CategoryNode, normalizeCategoryCode} from "@/utils/categoryTree";
import {useCart, useFavorites} from "@/services/localProductStorage";
import {useCatalogOverlay} from "@/components/CatalogPage/CatalogOverlayProvider";
import CatalogMobileSheet from "@/components/CatalogPage/CatalogMobileSheet";

const MobileBottomNavigation = () => {
    const locale = useLocale() as LocaleEnum;
    const navT = useTranslations("nav");
    const categoryT = useTranslations("catalog.categories");
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const {count: cartCount} = useCart();
    const {count: favoritesCount} = useFavorites();
    const {
        activeOverlay,
        closeOverlay,
        isBottomNavigationHidden,
        openOverlay,
    } = useCatalogOverlay();
    const [categories, setCategories] = useState<ICategory[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [trail, setTrail] = useState<CategoryNode[]>([]);

    const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
    const currentCategory = trail.at(-1);
    const visibleCategories = currentCategory?.children ?? categoryTree;
    const isCategoriesOpen = activeOverlay === "categories";
    const isCatalogActive = pathname.startsWith("/catalog") || isCategoriesOpen;
    const selectedCategoryCode = normalizeCategoryCode(searchParams?.get("categoryCode"));

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

    const openCategories = (event: ReactMouseEvent<HTMLButtonElement>) => {
        setTrail([]);
        openOverlay("categories", event.currentTarget);
    };

    const closeCategories = () => {
        closeOverlay("categories");
        setTrail([]);
    };

    const goToCategory = (category?: CategoryNode) => {
        closeCategories();
        router.push(routes.categorySelectionCatalog(category?.code, searchParams), {scroll: false});
    };

    const openCategory = (category: CategoryNode) => {
        if (category.children.length > 0) {
            setTrail((current) => [...current, category]);
            return;
        }

        goToCategory(category);
    };

    const goBack = () => {
        setTrail((current) => current.slice(0, -1));
    };

    return (
        <>
            <nav
                aria-label={navT("mobileBottomNav")}
                aria-hidden={isBottomNavigationHidden}
                data-hidden={isBottomNavigationHidden ? "true" : "false"}
                className={cn(
                    "fixed inset-x-0 bottom-0 z-[850] border-t border-border-default bg-primary-bg/95 shadow-[0_-10px_30px_rgb(0_0_0_/_0.08)] backdrop-blur transition-vympel motion-reduce:transition-none lg:hidden",
                    isBottomNavigationHidden && "pointer-events-none translate-y-full opacity-0"
                )}
            >
                <div className="mx-auto grid h-[var(--spacing-mobile-bottom-nav-height)] max-w-md grid-cols-5 items-stretch px-1 pb-[env(safe-area-inset-bottom)]">
                    <BottomNavLink
                        href={routes.home()}
                        label={navT("home")}
                        active={pathname === "/"}
                        icon={<Home className="size-5"/>}
                    />
                    <BottomNavButton
                        label={navT("categories")}
                        active={isCatalogActive}
                        icon={<ListTree className="size-5"/>}
                        onClick={openCategories}
                    />
                    <BottomNavLink
                        href={routes.cart()}
                        label={navT("cart")}
                        active={pathname.startsWith("/cart")}
                        icon={<ShoppingCart className="size-5"/>}
                        count={cartCount}
                    />
                    <BottomNavLink
                        href={routes.favorites()}
                        label={navT("favorites")}
                        active={pathname.startsWith("/favorites")}
                        icon={<Heart className="size-5"/>}
                        count={favoritesCount}
                    />
                    <div className="flex min-w-0 items-center justify-center">
                        <ProfileUnavailableButton
                            showLabel
                            side="top"
                            className="mobile-bottom-nav-item h-full w-full flex-col px-1 py-2"
                            iconClassName="size-5"
                            labelClassName="mt-1 text-[11px]"
                        />
                    </div>
                </div>
            </nav>

            <CatalogMobileSheet
                open={isCategoriesOpen}
                title={currentCategory?.name ?? navT("catalog")}
                variant="full"
                onOpenChange={(open) => {
                    if (!open) closeCategories();
                }}
            >
                <div className="flex h-full min-h-0 flex-col bg-surface-card">
                    <header className="flex min-h-16 items-center gap-3 border-b border-border-default bg-primary-bg px-4">
                        {trail.length > 0 ? (
                            <button
                                type="button"
                                aria-label={categoryT("back")}
                                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full transition-vympel-fast focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40"
                                onClick={goBack}
                            >
                                <ChevronLeft className="size-6" aria-hidden="true"/>
                            </button>
                        ) : null}

                        <Text as="h2" size="bodyLg" weight="medium" colors="headingPrimary" className="min-w-0 flex-1 truncate">
                            {currentCategory?.name ?? navT("catalog")}
                        </Text>

                        <button
                            type="button"
                            aria-label={navT("closeMenu")}
                            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full transition-vympel-fast focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40"
                            onClick={closeCategories}
                        >
                            <X className="size-6" aria-hidden="true"/>
                        </button>
                    </header>

                    <div className="catalog-filter-scroll flex-1 overflow-y-auto px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5">
                        {loading ? (
                            <Text size="bodySm">{categoryT("loading")}</Text>
                        ) : null}
                        {error ? (
                            <Text size="bodySm" className="text-error">{categoryT("error")}</Text>
                        ) : null}
                        {!loading && !error ? (
                            <div className="grid gap-2">
                                <CategoryRow
                                    label={categoryT("allProducts")}
                                    description={currentCategory?.name}
                                    active={
                                        currentCategory
                                            ? normalizeCategoryCode(currentCategory.code) === selectedCategoryCode
                                            : !selectedCategoryCode
                                    }
                                    strong
                                    onClick={() => goToCategory(currentCategory)}
                                />
                                {visibleCategories.map((category) => (
                                    <CategoryRow
                                        key={category.id}
                                        category={category}
                                        label={category.name}
                                        active={normalizeCategoryCode(category.code) === selectedCategoryCode}
                                        hasChildren={category.children.length > 0}
                                        onClick={() => openCategory(category)}
                                    />
                                ))}
                                {!visibleCategories.length ? (
                                    <Text size="bodySm" colors="muted" className="px-2 py-4">
                                        {categoryT("empty")}
                                    </Text>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                </div>
            </CatalogMobileSheet>
        </>
    );
};

type BottomNavBaseProps = {
    label: string;
    icon: ReactNode;
    active?: boolean;
    count?: number;
};

const bottomNavClass = (active?: boolean) => cn(
    "mobile-bottom-nav-item relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-text-muted transition-vympel-fast focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40",
    active && "text-text-heading-primary"
);

const BottomNavLink = ({href, label, icon, active, count}: BottomNavBaseProps & {href: string}) => (
    <Link href={href} aria-current={active ? "page" : undefined} className={bottomNavClass(active)}>
        <span className="relative">
            {icon}
            {count ? <CountBadge count={count}/> : null}
        </span>
        <Text as="span" size="caption" className="max-w-full truncate text-[11px] leading-none">
            {label}
        </Text>
    </Link>
);

const BottomNavButton = ({label, icon, active, onClick}: BottomNavBaseProps & {onClick: (event: ReactMouseEvent<HTMLButtonElement>) => void}) => (
    <button type="button" aria-current={active ? "page" : undefined} className={bottomNavClass(active)} onClick={onClick}>
        {icon}
        <Text as="span" size="caption" className="max-w-full truncate text-[11px] leading-none">
            {label}
        </Text>
    </button>
);

const CountBadge = ({count}: {count: number}) => (
    <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-button-bg-action text-[9px] leading-none text-button-text-action">
        {count > 99 ? "99+" : count}
    </span>
);

type CategoryRowProps = {
    active?: boolean;
    category?: CategoryNode;
    label: string;
    description?: string;
    hasChildren?: boolean;
    strong?: boolean;
    onClick: () => void;
};

const CategoryRow = ({active, category, label, description, hasChildren, strong, onClick}: CategoryRowProps) => (
    <button
        type="button"
        aria-current={active ? "page" : undefined}
        className={cn(
            "flex min-h-16 w-full items-center gap-3 rounded-xl bg-primary-bg px-4 py-3 text-left shadow-[0_1px_0_rgb(0_0_0_/_0.04)] transition-vympel-fast hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40",
            active && "bg-white ring-1 ring-text-heading-primary/15"
        )}
        onClick={onClick}
    >
        <span className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-card text-text-heading-primary",
            strong && "bg-text-heading-primary text-text-inverse",
            active && !strong && "bg-text-heading-primary text-text-inverse"
        )}>
            {getCategoryIcon(category)}
        </span>
        <span className="min-w-0 flex-1">
            <Text as="span" size="bodySm" weight={strong ? "medium" : "regular"} colors="headingPrimary" className="block leading-snug">
                {label}
            </Text>
            {description ? (
                <Text as="span" size="caption" colors="muted" className="mt-1 block truncate">
                    {description}
                </Text>
            ) : null}
        </span>
        {hasChildren ? <ChevronRight className="size-5 shrink-0 text-text-muted" aria-hidden="true"/> : null}
    </button>
);

const CATEGORY_ICON_BY_CODE: Record<string, LucideIcon> = {
    WATCH_WRIST: Watch,
    WATCH_INTERIOR: Clock3,
    WATCH_WALL: Clock3,
    WATCH_FLOOR: Clock,
    ACCESSORIES: PackageOpen,
    WATCH_CLASSIC: Crown,
    WATCH_SPORT: Activity,
    WATCH_DIVER: Waves,
    WATCH_CHRONOGRAPH: Timer,
    WATCH_KIDS: Baby,
    ACCESSORIES_WOMEN: Venus,
    ACCESSORIES_MEN: Mars,
};

function getCategoryIcon(category?: CategoryNode) {
    const Icon = category ? resolveCategoryIcon(category) : LayoutGrid;

    return <Icon className="size-5" aria-hidden="true"/>;
}

function resolveCategoryIcon(category: CategoryNode): LucideIcon {
    const code = category.code.toUpperCase();
    const exactIcon = CATEGORY_ICON_BY_CODE[code];

    if (exactIcon) {
        return exactIcon;
    }

    if (code.includes("WOMEN") || code.includes("FEMALE")) return Venus;
    if (code.includes("MEN") || code.includes("MALE")) return Mars;
    if (code.includes("ACCESS")) return PackageOpen;
    if (code.includes("BRAND")) return Tags;
    if (code.includes("INTERIOR") || code.includes("WALL")) return Clock3;
    if (code.includes("FLOOR") || code.includes("CLOCK")) return Clock;
    if (code.includes("WATCH")) return Watch;

    const name = category.name.toLowerCase();

    if (name.includes("\u0431\u0440\u0435\u043d\u0434") || name.includes("brand")) return Tags;
    if (name.includes("\u0430\u043a\u0441\u0435\u0441\u0441") || name.includes("accessor")) return PackageOpen;
    if (name.includes("\u0447\u0430\u0441") || name.includes("watch") || name.includes("clock")) return Watch;

    return Shapes;
}

export default MobileBottomNavigation;
