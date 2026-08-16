"use client";

import React, { useState } from "react";

import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi,
} from "@/components/ui/Carousel";

import { cn } from "@/lib/utils";
import Autoplay from "embla-carousel-autoplay";
import CarouselDots from "@/components/ui/shared/CarouselDots";
import BannerItem, {BannerItemProps} from "@/components/HomePage/bannerCarousel/Item";
import {routes} from "@/config/routes";
import {useTranslations} from "use-intl";
import {useCarouselAutoplayControl} from "@/hooks/useCarouselAutoplayControl";
import {Pause, Play} from "lucide-react";

type Props = {
    items?: (BannerItemProps & { id: number })[];
};

const BannerCarousel = ({items}: Props) => {
    const t = useTranslations("bannerCarousel");
    const [api, setApi] = useState<CarouselApi>();
    const [plugin] = useState(() => (
        Autoplay({delay: 5000, stopOnInteraction: true, playOnInit: false})
    ))
    const {isPlaying, autoplayAllowed, pauseAutoplay, resumeAutoplay} = useCarouselAutoplayControl(api, plugin);
    const pauseOnUserInteraction = (event: React.SyntheticEvent) => {
        const target = event.target;
        if (target instanceof Element && target.closest("[data-carousel-autoplay-control]")) {
            return;
        }
        pauseAutoplay();
    };
    const slides = items?.length ? items : Array.from({length: 4}, (_, index) => ({
        id: index + 1,
        link: routes.brand("romanson"),
        url: "/Romanson_banner.webp",
        alt: t("fallbackAlt"),
    }));

    return (
        <section className="relative group mt-11">
            <Carousel
                aria-label={t("aria")}
                setApi={setApi}
                opts={{ loop: true, duration: 10 }}
                plugins={[plugin]}
                onFocusCapture={pauseOnUserInteraction}
                onPointerDownCapture={pauseOnUserInteraction}
                className="w-full rounded-md overflow-hidden"
            >
                <CarouselContent className="ml-0">
                    {slides.map((item, index) => (
                        <CarouselItem key={item.id} className="pl-0">
                            <BannerItem {...item} priority={index === 0}/>
                        </CarouselItem>
                    ))}
                </CarouselContent>

                <CarouselPrevious
                    className={cn(
                        "opacity-0 left-3 pointer-events-none transition-opacity duration-200",
                        "group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto"
                    )}
                />
                <CarouselNext
                    className={cn(
                        "opacity-0 right-3 pointer-events-none transition-opacity duration-200",
                        "group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto"
                    )}
                />

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
                    <CarouselDots api={api} />
                    {autoplayAllowed && slides.length > 1 && (
                        <button
                            type="button"
                            data-carousel-autoplay-control
                            onClick={isPlaying ? pauseAutoplay : resumeAutoplay}
                            aria-label={isPlaying ? t("pauseAutoplay") : t("resumeAutoplay")}
                            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-bg/90 text-text-heading-primary shadow-state transition-colors hover:bg-primary-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-bg focus-visible:ring-offset-2 focus-visible:ring-offset-text-heading-primary"
                        >
                            {isPlaying ? <Pause className="size-5" aria-hidden="true"/> : <Play className="size-5" aria-hidden="true"/>}
                        </button>
                    )}
                </div>
            </Carousel>
        </section>
    );
};

export default BannerCarousel;
