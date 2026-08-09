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

type Props = {
    items?: (BannerItemProps & { id: number })[];
};

const BannerCarousel = ({items}: Props) => {
    const t = useTranslations("bannerCarousel");
    const carouselT = useTranslations("carousel");
    const [api, setApi] = useState<CarouselApi>();
    const [plugin] = useState(() => (
        Autoplay({delay: 5000, stopOnInteraction: true, playOnInit: false})
    ))
    const {isRotating, startRotation, stopRotation} = useCarouselAutoplayControl(plugin);
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
                onMouseEnter={stopRotation}
                onFocusCapture={stopRotation}
                onPointerDownCapture={stopRotation}
                className="w-full rounded-md overflow-hidden"
            >
                <button
                    type="button"
                    onClick={isRotating ? stopRotation : startRotation}
                    className="absolute left-3 top-3 z-30 min-h-11 rounded-full bg-primary-bg/90 px-4 text-sm text-text-heading-primary shadow-state focus:outline-none focus-visible:ring-2 focus-visible:ring-text-heading-primary/50"
                >
                    {isRotating ? carouselT("stopRotation") : carouselT("startRotation")}
                </button>
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

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
                    <CarouselDots api={api} />
                </div>
            </Carousel>
        </section>
    );
};

export default BannerCarousel;
