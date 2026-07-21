"use client";

import React, {FC, useEffect, useId, useState} from "react";
import {useTranslations} from "use-intl";

import {
    Carousel,
    CarouselApi,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious
} from "@/components/ui/Carousel";
import {cn} from "@/lib/utils";
import GoodCard from "@/components/GoodCard";
import ArrowRight from "@/assets/icons/ArrowRight";
import {IProductFeature} from "@/api/types/ProductTypes";
import GoodCardSkeleton from "@/components/GoodCard/Skeleton";
import {Text} from "@/components/ui/shared/text";
import CmsResponsiveImage from "@/components/ui/shared/CmsResponsiveImage";

export type GoodsCarouselItem = {
    id: number;
    name: string;
    price: number;
    imageUrl?: string | null;
    img?: string | null;
    stockQuantity?: number | null;
    status?: string | null;
    link?: string;
    description?: string;
    collection?: IProductFeature;
    ratingAverage?: number | null;
    ratingCount?: number | null;
}

type Props = {
    img?: string;
    mobileImg?: string;
    fallbackImg?: string;
    bannerAlt?: string;
    items: GoodsCarouselItem[] | undefined;
    className?: string;
    showBanner?: boolean;
    showProductActions?: boolean;
}

const GoodsCarouselWithImage: FC<Props> = ({
                                               img,
                                               mobileImg,
                                               fallbackImg = "/newsBanner.webp",
                                               bannerAlt,
                                               items,
                                               className,
                                               showBanner = true,
                                               showProductActions = false,
                                           }) => {
    const t = useTranslations("goodsCarousel");
    const [api, setApi] = useState<CarouselApi>();
    const [canPrev, setCanPrev] = useState(false);
    const [canNext, setCanNext] = useState(false);
    const carouselId = useId();
    const listId = `goods-carousel-${carouselId}`;

    useEffect(() => {
        if (!api) return;

        const update = () => {
            setCanPrev(api.canScrollPrev());
            setCanNext(api.canScrollNext());
        };

        update();
        api.on("select", update);
        api.on("reInit", update);

        return () => {
            api.off("select", update);
            api.off("reInit", update);
        };
    }, [api]);

    const renderProducts = () => {
        if (items?.length) {
            return (
                items?.map((item) => (
                    <CarouselItem
                        key={item.id}
                        className={cn(
                            "pl-0",
                            "basis-[calc((100%_-_12px)/2)] sm:basis-[42%] xl:basis-[270px]"
                        )}
                    >
                        <GoodCard
                            id={item.id}
                            img={item.imageUrl ?? item.img}
                            name={item.name}
                            price={item.price}
                            stockQuantity={item.stockQuantity}
                            status={item.status}
                            href={item.link}
                            description={item.description}
                            collection={item.collection}
                            ratingAverage={item.ratingAverage}
                            ratingCount={item.ratingCount}
                            isCatalog={showProductActions}
                            className="w-full"
                        />
                    </CarouselItem>
                ))
            );
        }

        return (
            new Array(15).fill(0).map((_, i) => (
                <CarouselItem
                    key={i}
                    className={cn(
                        "pl-0",
                        "basis-[calc((100%_-_12px)/2)] sm:basis-[42%] xl:basis-[270px]"
                    )}
                >
                    <GoodCardSkeleton key={i}/>
                </CarouselItem>
            ))
        );
    };

    return (
        <div className={cn("w-full select-none", img && showBanner && "goods-carousel-with-banner", className)}>
            {img && showBanner ? (
                <div className="goods-carousel-banner w-full">
                    <div className="h-full w-full overflow-hidden rounded-2xl sm:rounded-none">
                        <CmsResponsiveImage
                            desktopSrc={img}
                            mobileSrc={mobileImg}
                            fallbackSrc={fallbackImg}
                            alt={bannerAlt ?? t("bannerAlt")}
                            className="h-full w-full object-cover"
                            pictureClassName="block h-full w-full"
                        />
                    </div>
                </div>
            ) : null}
            <div
                className={cn("w-full relative", img && showBanner && "goods-carousel-track")}
            >
                <Carousel
                    aria-label={t("productsAria")}
                    setApi={setApi}
                    opts={{
                        align: "start",
                        loop: false,
                    }}
                    className="relative mx-auto w-full sm:px-12 lg:w-[82vw] lg:max-w-[1128px] lg:px-14"
                >
                    <CarouselContent id={listId} className="ml-0 gap-3 sm:gap-9 lg:gap-17">
                        {renderProducts()}
                    </CarouselContent>

                    <nav aria-label={t("controlsAria")}>
                        <CarouselPrevious
                            setClassName
                            type="button"
                            aria-label={t("previousItems")}
                            aria-controls={listId}
                            aria-disabled={!canPrev}
                            disabled={!canPrev}
                            className="goods-carousel-arrow absolute left-0 top-1/2 hidden h-auto w-9 -translate-y-1/2 cursor-pointer disabled:cursor-not-allowed sm:block"
                        >
                            <ArrowRight className="h-auto w-9 rotate-180 transition"/>
                            <Text as="span" className="sr-only">{t("previous")}</Text>
                        </CarouselPrevious>

                        <CarouselNext
                            setClassName
                            type="button"
                            aria-label={t("nextItems")}
                            aria-controls={listId}
                            aria-disabled={!canNext}
                            disabled={!canNext}
                            className="goods-carousel-arrow absolute right-0 top-1/2 hidden h-auto w-9 -translate-y-1/2 cursor-pointer disabled:cursor-not-allowed sm:block"
                        >
                            <ArrowRight className="h-auto w-9 transition"/>
                            <Text as="span" className="sr-only">{t("next")}</Text>
                        </CarouselNext>
                    </nav>
                </Carousel>
            </div>
        </div>
    );
};

export default GoodsCarouselWithImage;
