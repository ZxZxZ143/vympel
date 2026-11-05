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
import {useImageDiscovery} from "./useImageDiscovery";

export type GoodsCarouselItem = {
    id: number;
    name: string;
    price: number;
    discountPercent?: number | null;
    finalPrice?: number | null;
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
    loading?: boolean;
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
                                               loading = false,
                                           }) => {
    const t = useTranslations("goodsCarousel");
    const [api, setApi] = useState<CarouselApi>();
    const [canPrev, setCanPrev] = useState(false);
    const [canNext, setCanNext] = useState(false);
    const carouselId = useId();
    const listId = `goods-carousel-${carouselId}`;
    const {rootRef, enhanced, ready, loadImage} = useImageDiscovery(items, api);

    useEffect(() => {
        const viewport = rootRef.current?.querySelector<HTMLElement>('[data-slot="carousel-content"]');
        const update = () => {
            setCanPrev(ready && api ? api.canScrollPrev() : Boolean(viewport && viewport.scrollLeft > 1));
            setCanNext(ready && api ? api.canScrollNext() : Boolean(viewport && viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - 1));
        };

        update();
        api?.on("select", update);
        api?.on("reInit", update);
        viewport?.addEventListener("scroll", update, {passive: true});
        window.addEventListener("resize", update, {passive: true});

        return () => {
            api?.off("select", update);
            api?.off("reInit", update);
            viewport?.removeEventListener("scroll", update);
            window.removeEventListener("resize", update);
        };
    }, [api, ready, rootRef, items, loading]);

    const scrollFallback = (direction: number) => {
        const viewport = rootRef.current?.querySelector<HTMLElement>('[data-slot="carousel-content"]');
        viewport?.scrollBy({left: direction * viewport.clientWidth / 2});
    };

    const renderProducts = () => {
        if (items?.length) {
            return (
                items?.map((item, index) => (
                    <CarouselItem
                        key={item.id}
                        {...(!ready ? {"aria-hidden": undefined, inert: undefined} : {})}
                        className={cn(
                            "pl-0",
                            "basis-[calc((100%_-_12px)/2)] sm:basis-[42%] xl:basis-[270px]"
                        )}
                    >
                        <GoodCard
                            id={item.id}
                            img={item.imageUrl ?? item.img}
                            loadImage={loadImage(item, index)}
                            name={item.name}
                            price={item.price}
                            discountPercent={item.discountPercent}
                            finalPrice={item.finalPrice}
                            stockQuantity={item.stockQuantity}
                            status={item.status}
                            href={item.link}
                            description={item.description}
                            collection={item.collection}
                            ratingAverage={item.ratingAverage}
                            ratingCount={item.ratingCount}
                            isCatalog={showProductActions}
                            headingLevel="h3"
                            className="w-full"
                        />
                    </CarouselItem>
                ))
            );
        }

        if (!loading) return null;

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

    if (!loading && !items?.length) return null;

    return (
        <div
            ref={rootRef}
            className={cn("w-full select-none", img && showBanner && "goods-carousel-with-banner", className)}
            aria-busy={loading}
        >
            {loading ? <Text role="status" className="sr-only">{t("loading")}</Text> : null}
            {img && showBanner ? (
                <div className="goods-carousel-banner w-full">
                    <div className="h-full w-full overflow-hidden rounded-2xl sm:rounded-none" data-motion="media">
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
                        active: enhanced,
                    }}
                    className={cn("relative mx-auto w-full sm:px-12 lg:w-[82vw] lg:max-w-[1128px] lg:px-14",
                        !ready && "[&_[data-slot=carousel-content]]:overflow-x-auto")}
                    {...(!ready ? {onKeyDownCapture: (event: React.KeyboardEvent<HTMLDivElement>) => {
                        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                        scrollFallback(event.key === "ArrowLeft" ? -1 : 1);
                        event.preventDefault();
                    }} : {})}
                >
                    <CarouselContent id={listId} className="ml-0 gap-3 sm:gap-9 lg:gap-17" data-motion="stagger">
                        {renderProducts()}
                    </CarouselContent>

                    <nav aria-label={t("controlsAria")}>
                        <CarouselPrevious
                            {...(!ready ? {onClick: () => scrollFallback(-1)} : {})}
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
                            {...(!ready ? {onClick: () => scrollFallback(1)} : {})}
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
