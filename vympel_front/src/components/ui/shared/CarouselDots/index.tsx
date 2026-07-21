"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { CarouselApi } from "@/components/ui/Carousel";

type Props = {
    api?: CarouselApi;

    className?: string;

    dotClassName?: string;

    activeDotClassName?: string;

    hideWhenSingle?: boolean;

    ariaLabel?: string;

    getDotAriaLabel?: (index: number) => string;
};

export default function CarouselDots({
                                         api,
                                         className,
                                         dotClassName,
                                         activeDotClassName,
                                         hideWhenSingle = true,
                                         ariaLabel = "Carousel pagination",
                                         getDotAriaLabel = (index) => `Go to slide ${index + 1}`,
                                     }: Props) {
    const [current, setCurrent] = useState(0);
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!api) return;

        const sync = () => {
            setCount(api.scrollSnapList().length);
            setCurrent(api.selectedScrollSnap());
        };

        sync();
        api.on("select", sync);
        api.on("reInit", sync);

        return () => {
            api.off("select", sync);
            api.off("reInit", sync);
        };
    }, [api]);

    if (!api) return null;
    if (hideWhenSingle && count <= 1) return null;

    return (
        <div
            role="tablist"
            aria-label={ariaLabel}
            className={cn("flex items-center gap-3", className)}
        >
            {Array.from({ length: count }).map((_, i) => {
                const isActive = i === current;

                return (
                    <button
                        key={i}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-label={getDotAriaLabel(i)}
                        onClick={() => api.scrollTo(i)}
                        className={cn(
                            "transition-all duration-200 rounded-full",
                            isActive ? "w-12 h-3 bg-button-bg-default" : "w-3 h-3 bg-button-bg-default/70 hover:bg-button-bg-default",
                            dotClassName,
                            isActive && activeDotClassName
                        )}
                    />
                );
            })}
        </div>
    );
}
