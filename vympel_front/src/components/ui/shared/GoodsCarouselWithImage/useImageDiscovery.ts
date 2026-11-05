"use client";

import {useEffect, useRef, useState, useSyncExternalStore} from "react";
import type {CarouselApi} from "@/components/ui/Carousel";
import {adjacentImageIndexes, imageIdentity, INITIAL_IMAGE_COUNT} from "./imageDiscovery";
import type {GoodsCarouselItem} from ".";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function useImageDiscovery(items: GoodsCarouselItem[] | undefined, api: CarouselApi) {
    const rootRef = useRef<HTMLDivElement>(null);
    const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
    const enhanced = hydrated && typeof IntersectionObserver !== "undefined"
        && typeof ResizeObserver !== "undefined" && typeof MutationObserver !== "undefined";
    const [discovered, setDiscovered] = useState<ReadonlySet<string>>(() => new Set());
    const ready = enhanced && Boolean(api);

    useEffect(() => {
        const viewport = rootRef.current?.querySelector<HTMLElement>('[data-slot="carousel-content"]');
        if (!viewport || !items?.length || !enhanced) return;
        let frame = 0;
        const discover = () => {
            frame = 0;
            const bounds = viewport.getBoundingClientRect();
            const slides = api?.slideNodes() ?? Array.from(viewport.querySelectorAll<HTMLElement>('[data-slot="carousel-item"]'));
            // Geometry also covers the first frame before Embla's IO callback,
            // native scrolling without an API, and movement between scroll snaps.
            const visible = slides.flatMap((slide, index) => {
                const rect = slide.getBoundingClientRect();
                return rect.right > bounds.left + 1 && rect.left < bounds.right - 1 ? [index] : [];
            });
            const keys = adjacentImageIndexes(visible, items.length).map(index => imageIdentity(items[index]));
            setDiscovered(previous => {
                if (keys.every(key => previous.has(key))) return previous;
                return new Set([...previous, ...keys]);
            });
        };
        const schedule = () => { if (!frame) frame = requestAnimationFrame(discover); };
        for (const event of ["select", "scroll", "slidesInView", "reInit"] as const) api?.on(event, schedule);
        viewport.addEventListener("scroll", schedule, {passive: true});
        window.addEventListener("resize", schedule, {passive: true});
        schedule();
        return () => {
            cancelAnimationFrame(frame);
            for (const event of ["select", "scroll", "slidesInView", "reInit"] as const) api?.off(event, schedule);
            viewport.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", schedule);
        };
    }, [api, enhanced, items]);

    return {
        rootRef, enhanced, ready,
        loadImage: (item: GoodsCarouselItem, index: number) => index < INITIAL_IMAGE_COUNT
            || (hydrated && !enhanced) || discovered.has(imageIdentity(item)),
    };
}
