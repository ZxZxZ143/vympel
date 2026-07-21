"use client";

import React, {useEffect, useRef, useState, useTransition} from "react";
import {ChevronDown} from "lucide-react";

import {Text} from "@/components/ui/shared/text";
import {Heading} from "@/components/ui/shared/text/Heading";
import {cn} from "@/lib/utils";
import {useLocale, useTranslations} from "use-intl";
import {usePathname, useRouter, Link} from "@/i18n/navigation";
import {LocaleEnum, locales} from "@/i18n/routing";
import Phone from "@/assets/icons/Phone";
import Message from "@/assets/icons/Message";
import Earth from "@/assets/icons/Earth";
import Favorite from "@/assets/icons/Favorite";
import Basket from "@/assets/icons/Basket";
import {useCart, useFavorites} from "@/services/localProductStorage";
import {CONTACT_LINKS, routes} from "@/config/routes";
import ProfileUnavailableButton from "@/components/ui/layout/ProfileUnavailableButton";

const Header = () => {
    const [isLangOpen, setIsLangOpen] = useState(false);
    const [, startTransition] = useTransition()
    const langRef = useRef<HTMLDivElement | null>(null);

    const locale = useLocale();
    const t = useTranslations("nav");
    const {count: favoritesCount} = useFavorites();
    const {count: cartCount} = useCart();

    const router = useRouter();
    const pathname = usePathname();
    const isBannerOverlayPage = pathname.startsWith("/product/") || pathname.startsWith("/catalog");

    const handleSelectLang = (next: LocaleEnum) => {
        startTransition(() => {
            router.replace(pathname, {locale: next});
        })
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (!langRef.current) return;
            if (!langRef.current.contains(e.target as Node)) {
                setIsLangOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header
            style={isBannerOverlayPage ? {left: "50vw", transform: "translateX(-50%)"} : undefined}
            className={cn(
                "z-100 mx-auto w-full max-w-360 bg-transparent responsive-page-x py-4 sm:py-8 xl:px-12 xl:py-12",
                isBannerOverlayPage
                    ? "absolute top-0"
                    : "relative"
            )}
        >
            <nav
                aria-label={t("mainNavigation")}
                className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-4"
            >
                <div className="flex min-w-0 items-center justify-start gap-2 sm:gap-6">
                    <ul className="hidden items-center gap-4 sm:flex xl:gap-6">
                        <li>
                            <a
                                href={CONTACT_LINKS.phone}
                                aria-label={t("call")}
                                className="flex h-8 w-8 items-center justify-center cursor-pointer"
                            >
                                <Phone className="h-full w-full" />
                            </a>
                        </li>

                        <li>
                            <a
                                href={CONTACT_LINKS.whatsapp}
                                aria-label={t("message")}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-8 w-8 items-center justify-center cursor-pointer"
                            >
                                <Message className="h-full w-full" />
                            </a>
                        </li>
                    </ul>

                    <div ref={langRef} className="relative">
                        <button
                            type="button"
                            aria-haspopup="menu"
                            aria-expanded={isLangOpen}
                            onClick={() => setIsLangOpen((p) => !p)}
                            className="flex min-h-10 items-center justify-center rounded-sm cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40 sm:min-h-11"
                        >
                            <Earth className="h-5 w-5 sm:h-8 sm:w-8" />

                            <Text colors="headingSecondary" size="caption" className="sm:text-base">
                                {locale.toUpperCase()}
                            </Text>

                            <ChevronDown
                                className={cn(
                                    "h-4 w-4 transition sm:h-6 sm:w-6",
                                    isLangOpen && "rotate-180"
                                )}
                            />
                        </button>

                        <div
                            role="menu"
                            aria-label={t("languageSelector")}
                            className={cn(
                                "z-100 absolute left-0 top-12 flex flex-col items-center justify-center gap-4 px-8 py-6 rounded-sm bg-bg-lang-card/75 border border-border-default text-text-language",
                                "origin-top transition-all duration-200 ease-out",
                                isLangOpen
                                    ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                                    : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
                            )}
                        >
                            {(locales).map((lang) => (
                                <button
                                    key={lang}
                                    type="button"
                                    role="menuitem"
                                    onClick={() => handleSelectLang(lang)}
                                    className={cn(
                                        "cursor-pointer transition hover:text-text-heading-primary transition",
                                        locale === lang && "text-text-heading-primary"
                                    )}
                                >
                                    {lang.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex min-w-0 items-center justify-center">
                    <Link href={routes.home()} aria-label={t("homeLink")}>
                        <Heading as="h3" font="heading" colors="headingSecondary" className="text-2xl sm:text-3xl">
                            VYMPEL
                        </Heading>
                    </Link>
                </div>

                <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-6">
                    <ul className="hidden items-center gap-2 sm:gap-6 lg:flex">
                        <li>
                            <ProfileUnavailableButton
                                side="bottom"
                                className="h-8 w-8"
                                iconClassName="h-full w-full"
                            />
                        </li>

                        <li>
                            <Link
                                href={routes.favorites()}
                                aria-label={t("favorites")}
                                className="relative flex h-10 w-10 items-center justify-center rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40 sm:h-8 sm:w-8"
                            >
                                <Favorite className="h-6 w-6 sm:h-full sm:w-full"/>
                                {favoritesCount > 0 ? (
                                    <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-button-bg-action text-[9px] leading-none text-button-text-action sm:-right-2 sm:-top-2 sm:size-5 sm:text-[10px]">
                                        {favoritesCount}
                                    </span>
                                ) : null}
                            </Link>
                        </li>

                        <li>
                            <Link
                                href={routes.cart()}
                                aria-label={t("cart")}
                                className="relative flex h-10 w-10 items-center justify-center rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40 sm:h-8 sm:w-8"
                            >
                                <Basket className="h-6 w-6 sm:h-full sm:w-full"/>
                                {cartCount > 0 ? (
                                    <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-button-bg-action text-[9px] leading-none text-button-text-action sm:-right-2 sm:-top-2 sm:size-5 sm:text-[10px]">
                                        {cartCount}
                                    </span>
                                ) : null}
                            </Link>
                        </li>
                    </ul>
                </div>
            </nav>
        </header>
    );
};

export default Header;
