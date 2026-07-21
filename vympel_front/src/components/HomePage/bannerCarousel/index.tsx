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

type Props = {
    items?: (BannerItemProps & { id: number })[];
};

const BannerCarousel = ({items}: Props) => {
    const t = useTranslations("bannerCarousel");
    const [api, setApi] = useState<CarouselApi>();
    const [plugin] = useState(() => (
        Autoplay({ delay: 5000, stopOnInteraction: true })
    ))
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
                onMouseEnter={plugin.stop}
                onMouseLeave={() => plugin.play(false)}
                className="w-full rounded-md overflow-hidden"
            >
                <CarouselContent className="ml-0">
                    {slides.map((item) => (
                        <CarouselItem key={item.id} className="pl-0">
                            <BannerItem {...item} />
                        </CarouselItem>
                    ))}
                </CarouselContent>

                <CarouselPrevious
                    className={cn(
                        "opacity-0 left-3 pointer-events-none transition-opacity duration-200",
                        "group-hover:opacity-100 group-hover:pointer-events-auto"
                    )}
                />
                <CarouselNext
                    className={cn(
                        "opacity-0 right-3 pointer-events-none transition-opacity duration-200",
                        "group-hover:opacity-100 group-hover:pointer-events-auto"
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
