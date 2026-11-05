"use client";

import {useEffect, useRef, useState, type ImgHTMLAttributes} from "react";
import {responsiveImage} from "@/utils/responsiveImages";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet"> & {
    src: string;
    maximumWidth?: number;
    priority?: boolean;
    loadImage?: boolean;
};

/** Native srcset uses pre-generated media and never calls the Next runtime optimizer. */
export default function ResponsiveProductImage({src, maximumWidth = 1600, priority = false, loadImage = true, onError, ...props}: Props) {
    const [failedVariant, setFailedVariant] = useState<string | null>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const image = failedVariant === src ? {src} : responsiveImage(src, maximumWidth);
    useEffect(() => {
        // A cached 404 can finish before React attaches onError during hydration.
        const node = imageRef.current;
        if (node?.complete && node.currentSrc && !node.naturalWidth) node.dispatchEvent(new Event("error"));
    }, [src, loadImage]);
    const element = (
        // eslint-disable-next-line @next/next/no-img-element -- Versioned, pre-generated responsive media.
        <img
            ref={imageRef}
            {...props}
            {...image}
            width={props.width}
            height={props.height}
            alt={props.alt ?? ""}
            decoding="async"
            loading={priority ? "eager" : props.loading ?? "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            onError={event => {
                if (failedVariant !== src && image.srcSet) setFailedVariant(src);
                else onError?.(event);
            }}
        />
    );
    // With scripting enabled noscript contains inert text, never a discoverable
    // image. Without JS the same responsive resource remains progressively usable.
    return loadImage ? element : <noscript>{element}</noscript>;
}
