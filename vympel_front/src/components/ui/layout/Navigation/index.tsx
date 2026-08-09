"use client";

import React, {useEffect, useRef, useState} from "react";
import {ChevronDown, Menu, X} from "lucide-react";
import {Text} from "@/components/ui/shared/text";

import {useTranslations} from "use-intl";
import {Link, usePathname} from "@/i18n/navigation";
import {PUBLIC_BRANDS} from "@/config/brandRoutes";
import {cn} from "@/lib/utils";
import {catalogLinks, CONTACT_LINKS, routes} from "@/config/routes";
import SmartSearch from "@/components/ui/shared/SmartSearch";
import {Dialog as DialogPrimitive} from "radix-ui";

const linkTextClass =
    'relative inline-block pb-1 whitespace-nowrap truncate' +
    'after:content-[""] after:absolute after:left-1/2 after:-translate-x-1/2 ' +
    'after:bottom-0 after:h-0.5 after:w-8/10 after:rounded-full after:bg-text-heading-primary ' +
    'after:origin-center after:scale-x-0 after:transition-transform after:duration-300 after:ease-out ' +
    'hover:after:scale-x-100';

const Navigation = () => {
    const brandsMenuId = "nav-brands-menu";
    const t = useTranslations("nav");
    const pathname = usePathname();
    const [isBrandsOpen, setIsBrandsOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navRef = useRef<HTMLElement | null>(null);
    const brandsTriggerRef = useRef<HTMLButtonElement | null>(null);
    const isBrandsActive = pathname.startsWith("/brands");
    const primaryLinks = [
        {href: routes.catalog(), label: t("catalog")},
        {href: catalogLinks.wristWatches, label: t("wrist")},
        {href: catalogLinks.interiorWatches, label: t("interior")},
        {href: catalogLinks.accessories, label: t("accessories")},
    ];
    const infoLinks = [
        {href: routes.about(), label: t("about")},
        {href: routes.payment(), label: t("payment")},
        {href: routes.guarantee(), label: t("warranty")},
        {href: routes.delivery(), label: t("delivery")},
    ];

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!navRef.current?.contains(event.target as Node)) {
                setIsBrandsOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape" && isBrandsOpen) {
                setIsBrandsOpen(false);
                brandsTriggerRef.current?.focus();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isBrandsOpen]);

    return (
        <DialogPrimitive.Root open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen} modal>
        <nav
            ref={navRef}
            aria-label={t("primaryNavigation")}
            className="home-search-host relative flex w-full flex-col gap-4 responsive-page-x xl:flex-row xl:items-center xl:justify-between xl:gap-10"
        >
            <div className="home-search-host-mobile relative flex items-center gap-3 xl:hidden">
                <DialogPrimitive.Trigger asChild>
                    <button
                        type="button"
                        aria-label={t("openMenu")}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border-default bg-primary-bg text-text-heading-primary transition-vympel-fast focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40"
                        onClick={() => setIsBrandsOpen(false)}
                    >
                        <Menu className="size-6" aria-hidden="true"/>
                    </button>
                </DialogPrimitive.Trigger>
                <SmartSearch
                    variant="home"
                    className="min-w-0 flex-1"
                    onOpen={() => {
                        setIsBrandsOpen(false);
                        setIsMobileMenuOpen(false);
                    }}
                />
            </div>

            <ul className="hidden items-center gap-x-5 gap-y-3 pb-1 xl:flex xl:gap-9 xl:pb-0">
                {primaryLinks.map((item) => (
                    <li key={item.href}>
                        <Link href={item.href} className="inline-flex">
                            <Text as="span" size="bodyLg" colors="headingPrimary" className={linkTextClass}>
                                {item.label}
                            </Text>
                        </Link>
                    </li>
                ))}

                <li>
                    <button
                        ref={brandsTriggerRef}
                        type="button"
                        aria-controls={brandsMenuId}
                        aria-expanded={isBrandsOpen}
                        onClick={() => setIsBrandsOpen((current) => !current)}
                        className="inline-flex cursor-pointer items-center gap-1"
                    >
                        <Text
                            as="span"
                            size="bodyLg"
                            colors="headingPrimary"
                            weight={isBrandsActive || isBrandsOpen ? "medium" : "regular"}
                            className={cn(linkTextClass, (isBrandsActive || isBrandsOpen) && "after:scale-x-100")}
                        >
                            {t('brands')}
                        </Text>
                        <ChevronDown
                            aria-hidden="true"
                            className={cn(
                                "h-5 w-5 transition",
                                isBrandsOpen && "rotate-180"
                            )}
                        />
                    </button>
                </li>
            </ul>

            <SmartSearch variant="home" onOpen={() => setIsBrandsOpen(false)} className="hidden xl:block" />

            {isBrandsOpen ? (
                <div
                    id={brandsMenuId}
                    aria-label={t("brandDropdownAria")}
                    className="absolute left-1/2 top-full z-50 mt-brand-nav-dropdown-offset hidden w-full -translate-x-1/2 origin-top rounded-2xl border border-border-default bg-bg-lang-card/75 px-20 py-7 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 xl:block"
                >
                    <ul className="flex flex-wrap items-center justify-between gap-x-10 gap-y-4">
                        {PUBLIC_BRANDS.map((brand) => (
                            <li key={brand.slug}>
                                <Link
                                    href={routes.brand(brand.slug)}
                                    onClick={() => setIsBrandsOpen(false)}
                                    className="inline-flex rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40"
                                >
                                    <Text as="span" size="bodyLg">
                                        {brand.displayName}
                                    </Text>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}

            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay
                    className="fixed inset-0 z-[900] bg-black/30 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none xl:hidden"
                />
                <DialogPrimitive.Content
                    className="fixed left-0 top-0 z-[910] flex h-full w-[min(360px,calc(100vw-20px))] flex-col overflow-y-auto bg-primary-bg px-4 py-4 shadow-state outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-left data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-left motion-reduce:animate-none sm:px-5 sm:py-5 xl:hidden"
                >
                    <div className="flex items-center justify-between gap-4 border-b border-border-default pb-5">
                        <DialogPrimitive.Title asChild>
                        <Text as="span" size="bodyLg" weight="medium" colors="headingPrimary">
                            {t("mobileMenu")}
                        </Text>
                        </DialogPrimitive.Title>
                        <DialogPrimitive.Close
                            type="button"
                            aria-label={t("closeMenu")}
                            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border-default transition-vympel-fast focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40"
                        >
                            <X className="size-6" aria-hidden="true"/>
                        </DialogPrimitive.Close>
                    </div>

                    <div className="space-y-6 py-6">
                        <section aria-labelledby="mobile-catalog-nav-title">
                            <Text
                                id="mobile-catalog-nav-title"
                                as="span"
                                size="caption"
                                weight="medium"
                                colors="muted"
                                className="mb-3 block uppercase"
                            >
                                {t("catalog")}
                            </Text>
                            <ul className="grid grid-cols-1 gap-1">
                                {primaryLinks.map((item) => (
                                    <li key={`mobile-${item.href}`}>
                                        <Link
                                            href={item.href}
                                            onClick={closeMobileMenu}
                                            className="flex min-h-10 items-center rounded-lg px-3 py-2 transition-vympel-fast hover:bg-surface-card focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40"
                                        >
                                            <Text as="span" size="bodyMd" colors="headingPrimary" className="leading-snug">
                                                {item.label}
                                            </Text>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section aria-labelledby="mobile-brand-nav-title">
                            <Text
                                id="mobile-brand-nav-title"
                                as="span"
                                size="caption"
                                weight="medium"
                                colors="muted"
                                className="mb-3 block uppercase"
                            >
                                {t("brands")}
                            </Text>
                            <ul className="grid grid-cols-2 gap-2">
                                {PUBLIC_BRANDS.map((brand) => (
                                    <li key={`mobile-${brand.slug}`}>
                                        <Link
                                            href={routes.brand(brand.slug)}
                                            onClick={closeMobileMenu}
                                            className="flex h-full min-h-10 w-full items-center justify-center rounded-full border border-border-default px-3 py-2 text-center transition-vympel-fast hover:bg-surface-card focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40"
                                        >
                                            <Text as="span" size="bodySm" colors="headingPrimary" className="min-w-0 whitespace-normal break-words text-center leading-snug">
                                                {brand.displayName}
                                            </Text>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section aria-labelledby="mobile-info-nav-title">
                            <Text
                                id="mobile-info-nav-title"
                                as="span"
                                size="caption"
                                weight="medium"
                                colors="muted"
                                className="mb-3 block uppercase"
                            >
                                {t("info")}
                            </Text>
                            <ul className="grid grid-cols-1 gap-1">
                                {infoLinks.map((item) => (
                                    <li key={`mobile-${item.href}`}>
                                        <Link
                                            href={item.href}
                                            onClick={closeMobileMenu}
                                            className="flex min-h-10 items-center rounded-lg px-3 py-2 transition-vympel-fast hover:bg-surface-card focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40"
                                        >
                                            <Text as="span" size="bodyMd" colors="headingPrimary" className="leading-snug">
                                                {item.label}
                                            </Text>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section aria-labelledby="mobile-contact-nav-title">
                            <Text
                                id="mobile-contact-nav-title"
                                as="span"
                                size="caption"
                                weight="medium"
                                colors="muted"
                                className="mb-3 block uppercase"
                            >
                                {t("contacts")}
                            </Text>
                            <div className="grid gap-3">
                                <a
                                    href={CONTACT_LINKS.phone}
                                    className="flex min-h-10 items-center rounded-lg px-3 py-2 transition-vympel-fast hover:bg-surface-card focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40"
                                >
                                    <Text as="span" size="bodyMd" colors="headingPrimary">
                                        {t("call")}
                                    </Text>
                                </a>
                                <a
                                    href={CONTACT_LINKS.whatsapp}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex min-h-10 items-center rounded-lg px-3 py-2 transition-vympel-fast hover:bg-surface-card focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40"
                                >
                                    <Text as="span" size="bodyMd" colors="headingPrimary">
                                        {t("message")}
                                    </Text>
                                </a>
                            </div>
                        </section>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </nav>
        </DialogPrimitive.Root>
    );
};

export default Navigation;
