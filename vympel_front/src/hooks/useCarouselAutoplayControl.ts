"use client";

import {useCallback, useEffect, useState} from "react";
import type {AutoplayType} from "embla-carousel-autoplay";
import type {CarouselApi} from "@/components/ui/Carousel";

export function useCarouselAutoplayControl(api: CarouselApi | undefined, plugin: AutoplayType) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [autoplayAllowed, setAutoplayAllowed] = useState(false);

    const pauseAutoplay = useCallback(() => {
        plugin.stop();
        setIsPlaying(false);
    }, [plugin]);

    const resumeAutoplay = useCallback(() => {
        if (!autoplayAllowed) {
            return;
        }
        plugin.play(false);
        setIsPlaying(true);
    }, [autoplayAllowed, plugin]);

    useEffect(() => {
        const media = window.matchMedia("(prefers-reduced-motion: reduce)");
        let frame: number | null = null;
        const syncMotionPreference = () => {
            const allowed = !media.matches;
            setAutoplayAllowed(allowed);
            if (!allowed) {
                plugin.stop();
                setIsPlaying(false);
                return;
            }
            frame = window.requestAnimationFrame(() => plugin.play(false));
        };

        syncMotionPreference();
        media.addEventListener("change", syncMotionPreference);
        return () => {
            media.removeEventListener("change", syncMotionPreference);
            if (frame !== null) {
                window.cancelAnimationFrame(frame);
            }
            plugin.stop();
        };
    }, [plugin]);

    useEffect(() => {
        if (!api) {
            return;
        }
        const onPlay = () => setIsPlaying(true);
        const onStop = () => setIsPlaying(false);
        const syncFrame = window.requestAnimationFrame(() => setIsPlaying(plugin.isPlaying()));
        api.on("autoplay:play", onPlay);
        api.on("autoplay:stop", onStop);
        return () => {
            window.cancelAnimationFrame(syncFrame);
            api.off("autoplay:play", onPlay);
            api.off("autoplay:stop", onStop);
        };
    }, [api, plugin]);

    return {isPlaying, autoplayAllowed, pauseAutoplay, resumeAutoplay};
}
