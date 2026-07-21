'use client'

import React, {useState} from 'react';
import {
    Carousel,
    type CarouselApi,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious
} from "@/components/ui/Carousel";
import Autoplay from "embla-carousel-autoplay";
import CarouselDots from "@/components/ui/shared/CarouselDots";
import {BrandsCarouselConfig} from "@/components/HomePage/BrandsCarousel/config";
import BrandCarouselCard from "@/components/HomePage/BrandsCarousel/Card";

const BrandsCarousel = () => {
    const [api, setApi] = useState<CarouselApi>();
    const [plugin] = useState(() => (
        Autoplay({ delay: 10000, stopOnInteraction: true })
    ))

    return (
        <div className="w-full group">
            <Carousel
                setApi={setApi}
                opts={{loop: true, duration: 10}}
                plugins={[plugin]}
                onMouseEnter={plugin.stop}
                onMouseLeave={() => plugin.play(false)}
            >
                <CarouselContent>
                    {
                        BrandsCarouselConfig().map((item, index) => (
                            <CarouselItem key={index}>
                                <BrandCarouselCard
                                    img={item.img}
                                    name={item.name}
                                    description={item.description}
                                    link={item.link}
                                />
                            </CarouselItem>
                        ))
                    }
                </CarouselContent>
                <CarouselPrevious
                    className="left-3 opacity-0 pointer-events-none transition-opacity duration-200 group-hover:opacity-100 group-hover:pointer-events-auto"/>
                <CarouselNext
                    className="right-3 opacity-0 pointer-events-none transition-opacity duration-200 group-hover:opacity-100 group-hover:pointer-events-auto"/>
            </Carousel>

            <div className="mt-10 mx-auto w-fit">
                <CarouselDots api={api} dotClassName="w-3 h-3 bg-brands-carousel-dots hover:bg-brands-carousel-dots-active"
                              activeDotClassName="bg-brands-carousel-dots-active w-12"/>
            </div>
        </div>
    );
};

export default BrandsCarousel;
