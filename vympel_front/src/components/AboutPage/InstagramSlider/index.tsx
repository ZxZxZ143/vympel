"use client";

import React, {useState} from "react";
import Image from "next/image";
import {useTranslations} from "use-intl";

import {
    Carousel,
    CarouselApi,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/Carousel";
import CarouselDots from "@/components/ui/shared/CarouselDots";
import InstaStroke from "@/assets/icons/InstaStroke";
import {cn} from "@/lib/utils";
import {type AboutInstagramPost, resolveAboutInstagramPosts} from "@/utils/aboutInstagramPosts";

type Props = {
    posts: AboutInstagramPost[];
};

export default function AboutInstagramSlider({posts}: Props) {
    const t = useTranslations("aboutPage.social");
    const [api, setApi] = useState<CarouselApi>();
    const resolvedPosts = resolveAboutInstagramPosts(posts, (position) => t("postAlt", {number: position}));

    return (
        <Carousel
            setApi={setApi}
            opts={{align: "start", loop: resolvedPosts.length > 1}}
            className="about-instagram-carousel group"
            aria-label={t("dotsAria")}
        >
            <CarouselContent className="about-instagram-track">
                {resolvedPosts.map((post) => (
                    <CarouselItem key={post.id} className="about-instagram-slide">
                        {post.href ? <a
                            href={post.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={t("postAria", {description: post.alt})}
                            className="about-instagram-card group"
                        >
                            <Image
                                src={post.src}
                                alt={post.alt}
                                fill
                                loading="lazy"
                                sizes="(min-width: 1280px) 263px, (min-width: 768px) 28vw, 76vw"
                                className="about-instagram-image"
                            />
                            <span className="about-instagram-icon" aria-hidden="true">
                                <InstaStroke className="h-auto w-full max-w-6"/>
                            </span>
                        </a> : <div className="about-instagram-card group">
                            <Image
                                src={post.src}
                                alt={post.alt}
                                fill
                                loading="lazy"
                                sizes="(min-width: 1280px) 263px, (min-width: 768px) 28vw, 76vw"
                                className="about-instagram-image"
                            />
                            <span className="about-instagram-icon" aria-hidden="true">
                                <InstaStroke className="h-auto w-full max-w-6"/>
                            </span>
                        </div>}
                    </CarouselItem>
                ))}
            </CarouselContent>

            {resolvedPosts.length > 1 && <>
                <CarouselPrevious className={cn(
                    "left-3 z-20 opacity-0 pointer-events-none transition-opacity duration-200",
                    "group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto"
                )}/>
                <CarouselNext className={cn(
                    "right-3 z-20 opacity-0 pointer-events-none transition-opacity duration-200",
                    "group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto"
                )}/>
            </>}

            <CarouselDots
                api={api}
                className="about-instagram-dots"
                ariaLabel={t("dotsAria")}
                getDotAriaLabel={(index) => t("dotAria", {number: index + 1})}
            />
        </Carousel>
    );
}
