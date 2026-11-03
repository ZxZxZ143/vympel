"use client";

import {useEffect, useRef, useState} from "react";

import {cn} from "@/lib/utils";
import {responsiveImage} from "@/utils/responsiveImages";

type Props = {
    desktopSrc: string;
    mobileSrc?: string;
    fallbackSrc: string;
    alt: string;
    className?: string;
    pictureClassName?: string;
    priority?: boolean;
    decorative?: boolean;
    sizes?: string;
    maximumWidth?: number;
    loadImage?: boolean;
    coverHeight?: {mobile: string; desktop: string; tablet?: string};
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
    sizes = "100vw",
    maximumWidth = 2560,
    loadImage = true,
    coverHeight,
}: Props) {
    const identity = `${desktopSrc}|${mobileSrc}|${fallbackSrc}`;
    const imageRef = useRef<HTMLImageElement>(null);
    const [failure, setFailure] = useState({identity: "", stage: 0});
    const stage = failure.identity === identity ? failure.stage : 0;
    const resolvedDesktop = stage >= 2 ? fallbackSrc : desktopSrc;
    const resolvedMobile = stage >= 2 ? fallbackSrc : mobileSrc || desktopSrc;
    const desktop = responsiveImage(resolvedDesktop, stage % 2 ? 0 : maximumWidth);
    const mobile = responsiveImage(resolvedMobile, stage % 2 ? 0 : maximumWidth);
    useEffect(() => {
        const node = imageRef.current;
        if (loadImage && node?.complete && node.currentSrc && !node.naturalWidth) node.dispatchEvent(new Event("error"));
    }, [identity, loadImage]);
    const coverSizes = (image: ReturnType<typeof responsiveImage>, height?: string) => height && image.width && image.height
        ? `max(100vw, calc(${height} * ${image.width / image.height}))`
        : sizes;

    return (
        <picture className={pictureClassName}>
            <source media="(max-width: 639px)" srcSet={loadImage ? mobile.srcSet ?? mobile.src : undefined} sizes={coverSizes(mobile, coverHeight?.mobile)}/>
            {/* Pre-generated files preserve the separate CMS mobile/desktop compositions. */}
            <img
                ref={imageRef}
                src={loadImage ? desktop.src : undefined}
                srcSet={loadImage ? desktop.srcSet : undefined}
                sizes={coverHeight?.tablet
                    ? `(max-width: 1023px) ${coverSizes(desktop, coverHeight.tablet)}, ${coverSizes(desktop, coverHeight.desktop)}`
                    : coverSizes(desktop, coverHeight?.desktop)}
                alt={decorative ? "" : alt}
                aria-hidden={decorative ? true : undefined}
                className={cn(className)}
                loading={priority ? "eager" : "lazy"}
                fetchPriority={priority ? "high" : "auto"}
                decoding="async"
                onError={() => {
                    const active = window.matchMedia("(max-width: 639px)").matches ? mobile : desktop;
                    const next = active.srcSet ? stage + 1 : stage < 2 ? 2 : 3;
                    if (next > stage) setFailure({identity, stage: next});
                }}
            />
        </picture>
    );
}
