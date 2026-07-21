'use client'

import React from 'react';
import FooterList from "@/components/ui/layout/Footer/List";
import {ConfigFirstList, ConfigSecondList, ConfigThirdList} from "@/components/ui/layout/Footer/config";
import {H2} from "@/components/ui/shared/text/Heading";
import Insta from "@/assets/icons/Insta";
import WhatsApp from "@/assets/icons/WhatsApp";
import Subtract from "@/assets/icons/Subtract";
import {Text} from "@/components/ui/shared/text";
import {useTranslations} from "use-intl";
import MessageFill from "@/assets/icons/MessageFill";
import {CONTACT_LINKS} from "@/config/routes";
import {Link} from "@/i18n/navigation";
import {FooterListType} from "@/components/ui/layout/Footer/type";

const Footer = () => {
    const t = useTranslations("footer")
    const sectionLinks = ConfigFirstList();
    const catalogLinks = ConfigSecondList();
    const infoLinks = ConfigThirdList();

    return (
        <footer className="w-full responsive-page-x max-w-360 mx-auto">
            <div className="mt-[var(--spacing-responsive-section-y)] lg:hidden">
                <div className="rounded-3xl border border-border-default bg-surface-card px-5 py-6 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                        <H2 className="text-3xl uppercase" colors="headingSecondary" font="heading">Vympel</H2>
                        <div className="flex justify-center gap-2">
                            <a
                                href={CONTACT_LINKS.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={t("instagram")}
                                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-primary-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40"
                            >
                                <Insta />
                            </a>
                            <a
                                href={CONTACT_LINKS.whatsapp}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={t("message")}
                                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-primary-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40"
                            >
                                <WhatsApp />
                            </a>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-2">
                        <div className="flex min-h-11 items-center justify-center gap-3 rounded-2xl bg-primary-bg px-4">
                            <span className="flex size-6 items-center justify-center">
                                <Subtract className="h-auto w-full" />
                            </span>
                            <Text font="footer" weight="regular" size="bodySm" colors="headingPrimary">
                                {t("shop")}
                            </Text>
                        </div>
                        <a
                            href={CONTACT_LINKS.whatsapp}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex min-h-11 items-center justify-center gap-3 rounded-2xl bg-primary-bg px-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40"
                        >
                            <span className="flex size-6 items-center justify-center">
                                <MessageFill className="h-auto w-full" />
                            </span>
                            <Text font="footer" weight="regular" size="bodySm" colors="headingPrimary">
                                {t("message")}
                            </Text>
                        </a>
                    </div>
                </div>

                <div className="mt-5 grid gap-5">
                    <MobileFooterGroup title={t("sections")} items={sectionLinks}/>
                    <MobileFooterGroup title={t("information")} items={infoLinks}/>
                </div>
            </div>

            <div className="mt-[var(--spacing-responsive-section-y)] hidden flex-col gap-8 lg:flex lg:flex-row lg:justify-between lg:gap-10">
                <div className="flex-1">
                    <H2 className="text-3xl uppercase sm:text-4xl" colors="headingSecondary" font="heading">Vympel</H2>
                    <div className="my-4 flex gap-3 sm:my-5.5 sm:gap-4">
                        <a
                            href={CONTACT_LINKS.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={t("instagram")}
                            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40"
                        >
                            <Insta />
                        </a>
                        <a
                            href={CONTACT_LINKS.whatsapp}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={t("message")}
                            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40"
                        >
                            <WhatsApp />
                        </a>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 flex items-center justify-center">
                                <Subtract className="w-full h-auto" />
                            </div>
                            <Text font="footer" weight="regular" size="bodySm" colors="headingPrimary">
                                {
                                    t("shop")
                                }
                            </Text>
                        </div>
                        <a
                            href={CONTACT_LINKS.whatsapp}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex min-h-11 items-center gap-2 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40"
                        >
                            <div className="w-6 h-6 flex items-center justify-center">
                                <MessageFill className="w-full h-auto" />
                            </div>
                            <Text font="footer" weight="regular" size="bodySm" colors="headingPrimary">
                                {
                                    t("message")
                                }
                            </Text>
                        </a>
                    </div>
                </div>
                <div className="grid flex-2 w-full grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-8 lg:flex lg:justify-between">
                    <FooterList items={sectionLinks}/>
                    <FooterList items={catalogLinks}/>
                    <FooterList items={infoLinks}/>
                </div>
            </div>
            <Text size="bodyLg" weight="medium" font="footer" colors="copyright" className="w-fit mx-auto mt-12 mb-8 sm:mt-17 sm:mb-11">
                © Vympel, 2026
            </Text>
        </footer>
    );
};

const MobileFooterGroup = ({title, items}: {title: string; items: FooterListType[]}) => (
    <section
        aria-label={title}
        className="rounded-3xl border border-border-default bg-primary-bg px-4 py-5 text-center shadow-[0_10px_30px_rgb(0_0_0_/_0.04)]"
    >
        <Text as="h3" font="footer" weight="semibold" size="bodySm" colors="headingPrimary" className="mb-3 text-center">
            {title}
        </Text>
        <ul className="grid gap-2">
            {items.map((item) => (
                <li key={`${title}-${item.link}-${item.text}`}>
                    <Link
                        href={item.link}
                        className="flex min-h-11 items-center justify-center rounded-2xl bg-surface-card px-4 text-center transition-vympel-fast hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/40"
                    >
                        <Text font="footer" weight="regular" size="bodySm" colors="headingPrimary" className="leading-snug">
                            {item.text}
                        </Text>
                    </Link>
                </li>
            ))}
        </ul>
    </section>
);

export default Footer;
