"use client";

import React, {useState} from "react";
import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";
import {useTranslations} from "use-intl";

import {
    Carousel,
    CarouselApi,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/Carousel";
import CarouselDots from "@/components/ui/shared/CarouselDots";
import {CONTACT_LINKS} from "@/config/routes";
import InstaStroke from "@/assets/icons/InstaStroke";

const instagramPosts = [
    {id: 1, src: "/insta-1.webp", width: 542, height: 820},
    {id: 2, src: "/insta-2.png", width: 542, height: 820},
    {id: 3, src: "/insta-3.webp", width: 542, height: 820},
    {id: 4, src: "/insta-4.webp", width: 547, height: 820},
] as const;

export default function AboutInstagramSlider() {
    const t = useTranslations("aboutPage.social");
    const [api, setApi] = useState<CarouselApi>();
    const [plugin] = useState(() => (
        Autoplay({delay: 3500, stopOnInteraction: false, stopOnMouseEnter: true})
    ));

    return (
        <Carousel
            setApi={setApi}
            opts={{align: "start", loop: true}}
            plugins={[plugin]}
            className="about-instagram-carousel"
        >
            <CarouselContent className="about-instagram-track">
                {instagramPosts.map((post) => (
                    <CarouselItem key={post.id} className="about-instagram-slide">
                        <a
                            href={CONTACT_LINKS.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={t("postAria", {number: post.id})}
                            className="about-instagram-card group"
                        >
                            <Image
                                src={post.src}
                                alt={t("postAlt", {number: post.id})}
                                width={post.width}
                                height={post.height}
                                sizes="(min-width: 1280px) 263px, (min-width: 768px) 28vw, 76vw"
                                className="about-instagram-image"
                            />
                            <span className="about-instagram-icon" aria-hidden="true">
                                <InstaStroke className="h-auto w-full max-w-6"/>
                            </span>
                        </a>
                    </CarouselItem>
                ))}
            </CarouselContent>

            <CarouselDots
                api={api}
                className="about-instagram-dots"
                ariaLabel={t("dotsAria")}
                getDotAriaLabel={(index) => t("dotAria", {number: index + 1})}
            />
        </Carousel>
    );
}
