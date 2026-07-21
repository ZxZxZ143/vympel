import Image from "next/image";
import type {ReactNode} from "react";

import ClientIcon from "@/assets/icons/ClientIcon";
import ClockIcon from "@/assets/icons/ClockIcon";
import MapIcon from "@/assets/icons/MapIcon";
import PhoneIcon from "@/assets/icons/PhoneIcon";
import ShieldIcon from "@/assets/icons/ShieldIcon";
import Navigation from "@/components/ui/layout/Navigation";
import {Text} from "@/components/ui/shared/text";
import {Heading} from "@/components/ui/shared/text/Heading";
import {cn} from "@/lib/utils";

type InfoPageLayoutProps = {
    title: string;
    children: ReactNode;
};

export function InfoPageLayout({title, children}: InfoPageLayoutProps) {
    return (
        <main className="mx-auto max-w-360">
            <Navigation/>
            <section className="responsive-page-x pt-10 sm:pt-12">
                <Heading as="h1" size="h2" font="mono" colors="headingPrimary">
                    {title}
                </Heading>
                <div className="mt-info-title-text-gap">
                    {children}
                </div>
            </section>
        </main>
    );
}

type InfoTextBlockProps = {
    children: ReactNode;
    className?: string;
};

export function InfoTextBlock({children, className}: InfoTextBlockProps) {
    return (
        <div className={cn("space-y-info-paragraph-gap", className)}>
            {children}
        </div>
    );
}

type InfoParagraphProps = {
    children: ReactNode;
};

export function InfoParagraph({children}: InfoParagraphProps) {
    return (
        <Text size="bodyLg" weight="light" colors="primary" className="leading-normal">
            {children}
        </Text>
    );
}

type InfoListProps = {
    items: string[];
};

export function InfoList({items}: InfoListProps) {
    return (
        <ul className="space-y-0 pl-5 list-disc">
            {items.map((item) => (
                <li key={item}>
                    <Text size="bodyLg" weight="light" colors="primary" className="leading-normal">
                        {item}
                    </Text>
                </li>
            ))}
        </ul>
    );
}

type WarrantyBadgeProps = {
    icon: ReactNode;
    title: string;
    subtitle: string;
};

function WarrantyBadge({icon, title, subtitle}: WarrantyBadgeProps) {
    return (
        <article className="info-warranty-badge">
            <span aria-hidden="true" className="info-warranty-badge-icon">
                {icon}
            </span>
            <span>
                <Text as="span" size="bodyXl" colors="headingSecondary" className="block leading-none">
                    {title}
                </Text>
                <Text as="span" size="bodyXs" colors="muted" className="mt-2 block leading-none">
                    {subtitle}
                </Text>
            </span>
        </article>
    );
}

type WarrantyBadgesProps = {
    warrantyTitle: string;
    warrantySubtitle: string;
    supportTitle: string;
    supportSubtitle: string;
};

export function WarrantyBadges({
                                   warrantyTitle,
                                   warrantySubtitle,
                                   supportTitle,
                                   supportSubtitle,
                               }: WarrantyBadgesProps) {
    return (
        <div className="info-warranty-badges">
            <WarrantyBadge
                icon={<ShieldIcon/>}
                title={warrantyTitle}
                subtitle={warrantySubtitle}
            />
            <WarrantyBadge
                icon={<ClientIcon/>}
                title={supportTitle}
                subtitle={supportSubtitle}
            />
        </div>
    );
}

type IconInfoItemProps = {
    icon: ReactNode;
    mainLines: string[];
    subLines?: string[];
};

function IconInfoItem({icon, mainLines, subLines}: IconInfoItemProps) {
    return (
        <div className="info-contact-item w-full">
            <span aria-hidden="true" className="info-contact-icon">
                {icon}
            </span>
            <div className="w-full">
                <div>
                    {mainLines.map((line) => (
                        <Text
                            key={line}
                            size="bodyLg"
                            colors="headingPrimary"
                            className="leading-normal"
                        >
                            {line}
                        </Text>
                    ))}
                </div>
                {subLines?.length ? (
                    <div className="mt-info-contact-subtext-gap">
                        {subLines.map((line) => (
                            <Text
                                key={line}
                                size="bodyMd"
                                colors="muted"
                                className="leading-normal"
                            >
                                {line}
                            </Text>
                        ))}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export type StoreLocationBlockProps = {
    imageAlt: string;
    addressTitle: string;
    addressStreet: string;
    addressFloor: string;
    addressDistrict: string;
    addressPostalCode: string;
    hours: string;
    phone: string;
};

export function StoreLocationBlock({
                                       imageAlt,
                                       addressTitle,
                                       addressStreet,
                                       addressFloor,
                                       addressDistrict,
                                       addressPostalCode,
                                       hours,
                                       phone,
                                   }: StoreLocationBlockProps) {
    return (
        <section className="info-store-location" aria-label={addressTitle}>
            <div className="info-store-image-frame">
                <Image
                    src="/shop.webp"
                    alt={imageAlt}
                    fill
                    sizes="(min-width: 1280px) 659px, (min-width: 768px) 52vw, 100vw"
                    className="object-cover"
                />
            </div>
            <div className="info-store-contact w-full">
                <IconInfoItem
                    icon={<MapIcon/>}
                    mainLines={[addressTitle, addressStreet, addressFloor]}
                    subLines={[addressDistrict, addressPostalCode]}
                />
                <IconInfoItem
                    icon={<ClockIcon/>}
                    mainLines={[hours]}
                />
                <IconInfoItem
                    icon={<PhoneIcon/>}
                    mainLines={[phone]}
                />
            </div>
        </section>
    );
}
