"use client";

import {useCallback, useEffect, useState} from "react";

type AutoplayController = {
    play: (jump?: boolean) => void;
    stop: () => void;
};

export function useCarouselAutoplayControl(plugin: AutoplayController) {
    const [isRotating, setIsRotating] = useState(false);

    const stopRotation = useCallback(() => {
        plugin.stop();
        setIsRotating(false);
    }, [plugin]);

    const startRotation = useCallback(() => {
        plugin.play(false);
        setIsRotating(true);
    }, [plugin]);

    useEffect(() => {
        const media = window.matchMedia("(prefers-reduced-motion: reduce)");
        if (media.matches) {
            plugin.stop();
            return () => plugin.stop();
        }
        const frame = window.requestAnimationFrame(() => {
            plugin.play(false);
            setIsRotating(true);
        });
        return () => {
            window.cancelAnimationFrame(frame);
            plugin.stop();
        };
    }, [plugin]);

    return {isRotating, startRotation, stopRotation};
}
