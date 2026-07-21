"use client";

import {useState} from "react";

import {cn} from "@/lib/utils";

type Props = {
    desktopSrc: string;
    mobileSrc?: string;
    fallbackSrc: string;
    alt: string;
    className?: string;
    pictureClassName?: string;
    priority?: boolean;
    decorative?: boolean;
};

export default function CmsResponsiveImage({
    desktopSrc,
    mobileSrc,
    fallbackSrc,
    alt,
    className,
    pictureClassName,
    priority = false,
    decorative = false,
}: Props) {
    const [useFallback, setUseFallback] = useState(false);
    const resolvedDesktop = useFallback ? fallbackSrc : desktopSrc;
    const resolvedMobile = useFallback ? fallbackSrc : mobileSrc || desktopSrc;

    return (
        <picture className={pictureClassName}>
            <source media="(max-width: 639px)" srcSet={resolvedMobile}/>
            <img
                src={resolvedDesktop}
                alt={decorative ? "" : alt}
                aria-hidden={decorative ? true : undefined}
                className={cn(className)}
                loading={priority ? "eager" : "lazy"}
                fetchPriority={priority ? "high" : "auto"}
                onError={() => {
                    if (resolvedDesktop !== fallbackSrc || resolvedMobile !== fallbackSrc) {
                        setUseFallback(true);
                    }
                }}
            />
        </picture>
    );
}
