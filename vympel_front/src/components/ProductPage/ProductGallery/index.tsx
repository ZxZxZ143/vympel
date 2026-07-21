"use client";

import Image from "next/image";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {ChevronDown, ChevronLeft, ChevronRight, ChevronUp, X} from "lucide-react";
import {useTranslations} from "use-intl";

import {
    Carousel,
    type CarouselApi,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/Carousel";
import ProductImageFallback from "@/components/ui/shared/ProductImageFallback";
import {cn} from "@/lib/utils";
import {IProductImage} from "@/api/types/ProductTypes";

type Props = {
    images: IProductImage[];
    productName: string;
};

type EmblaApi = NonNullable<CarouselApi>;

const VISIBLE_THUMBNAILS = 5;
const THUMBNAIL_SCROLL_STEP = 2;

const focusVisibleClassName = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[rgb(30_30_30/0.35)]";
const galleryFrameClassName = "h-[clamp(300px,82vw,var(--spacing-product-gallery-main-mobile-height))] min-h-[300px] w-full sm:h-[var(--spacing-product-gallery-main-height)] sm:min-h-[var(--spacing-product-gallery-main-height)]";
const thumbnailClassName = "flex h-[var(--spacing-product-gallery-thumb-size)] w-[var(--spacing-product-gallery-thumb-size)] flex-none items-center justify-center overflow-hidden rounded-[var(--radius-sm)] border p-2 transition-[border-color,background-color,box-shadow,opacity] duration-150 ease-[var(--ease-vympel)] hover:border-[var(--color-product-gallery-active)]";
const thumbnailActiveClassName = "border-[var(--color-product-gallery-active)] bg-surface-card";
const thumbnailInactiveClassName = "border-border-default bg-primary-bg";
const thumbnailNavClassName = "flex h-[var(--spacing-product-gallery-thumb-nav)] w-full items-center justify-center border-0 bg-transparent text-[var(--color-product-gallery-control)] transition duration-150 ease-[var(--ease-vympel)] disabled:cursor-default disabled:opacity-30";
const mainImageNavClassName = "absolute top-1/2 z-[2] flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border-default bg-white/85 text-[var(--color-product-gallery-control)] shadow-[0_12px_34px_rgb(0_0_0/0.08)] transition duration-150 ease-[var(--ease-vympel)] hover:border-[var(--color-product-gallery-active)] hover:text-[var(--color-product-gallery-active)] disabled:cursor-default disabled:opacity-30 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100";
const lightboxControlClassName = "absolute z-[2] flex items-center justify-center rounded-full bg-[var(--color-product-gallery-lightbox-control)] text-[var(--color-product-gallery-control)] shadow-[0_12px_34px_rgb(0_0_0/0.16)] transition duration-150 ease-[var(--ease-vympel)] disabled:cursor-default disabled:opacity-30";

const ProductGallery = ({images, productName}: Props) => {
    const t = useTranslations("product.gallery");
    const [activeIndex, setActiveIndex] = useState(0);
    const [thumbnailStart, setThumbnailStart] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [mainCarouselApi, setMainCarouselApi] = useState<CarouselApi>();
    const [lightboxCarouselApi, setLightboxCarouselApi] = useState<CarouselApi>();
    const [failedImageUrls, setFailedImageUrls] = useState<string[]>([]);
    const mobileThumbnailRefs = useRef(new Map<number, HTMLButtonElement>());

    const orderedImages = useMemo(
        () => [...images]
            .filter((image) => Boolean(image.url))
            .sort((left, right) => {
                if (left.isMain !== right.isMain) {
                    return left.isMain ? -1 : 1;
                }
                return left.sortOrder - right.sortOrder || left.id - right.id;
            }),
        [images]
    );

    const imageCount = orderedImages.length;
    const maxIndex = Math.max(0, imageCount - 1);
    const selectedIndex = imageCount ? Math.min(Math.max(activeIndex, 0), maxIndex) : 0;
    const selectedImage = orderedImages[selectedIndex];
    const maxThumbnailStart = Math.max(0, imageCount - VISIBLE_THUMBNAILS);
    const safeThumbnailStart = Math.min(thumbnailStart, maxThumbnailStart);
    const visibleThumbnails = orderedImages
        .map((image, index) => ({image, index}))
        .slice(safeThumbnailStart, safeThumbnailStart + VISIBLE_THUMBNAILS);
    const hasThumbnailOverflow = imageCount > VISIBLE_THUMBNAILS;
    const canScrollThumbnailsUp = safeThumbnailStart > 0;
    const canScrollThumbnailsDown = safeThumbnailStart < maxThumbnailStart;

    const markImageFailed = useCallback((url: string) => {
        setFailedImageUrls((current) => current.includes(url) ? current : [...current, url]);
    }, []);

    const keepThumbnailVisible = useCallback((index: number) => {
        setThumbnailStart((current) => {
            const safeCurrent = Math.min(current, maxThumbnailStart);

            if (maxThumbnailStart <= 0) {
                return 0;
            }
            if (index >= safeCurrent + VISIBLE_THUMBNAILS - 1) {
                return Math.min(
                    maxThumbnailStart,
                    Math.max(index - VISIBLE_THUMBNAILS + 1, safeCurrent + THUMBNAIL_SCROLL_STEP)
                );
            }
            if (index <= safeCurrent) {
                return Math.max(0, Math.min(index, safeCurrent - THUMBNAIL_SCROLL_STEP));
            }

            return safeCurrent;
        });
    }, [maxThumbnailStart]);

    const selectImage = useCallback((index: number) => {
        const nextIndex = Math.min(Math.max(index, 0), maxIndex);
        setActiveIndex(nextIndex);
        keepThumbnailVisible(nextIndex);
        mainCarouselApi?.scrollTo(nextIndex);
        if (isLightboxOpen) {
            lightboxCarouselApi?.scrollTo(nextIndex);
        }
    }, [isLightboxOpen, keepThumbnailVisible, lightboxCarouselApi, mainCarouselApi, maxIndex]);

    const moveThumbnailWindow = useCallback((direction: -1 | 1) => {
        setThumbnailStart((current) => {
            const next = current + (direction * THUMBNAIL_SCROLL_STEP);
            return Math.min(Math.max(next, 0), maxThumbnailStart);
        });
    }, [maxThumbnailStart]);

    const syncFromCarousel = useCallback((api: EmblaApi) => {
        const nextIndex = api.selectedScrollSnap();
        setActiveIndex(nextIndex);
        keepThumbnailVisible(nextIndex);
    }, [keepThumbnailVisible]);

    useEffect(() => {
        if (!mainCarouselApi) {
            return;
        }

        const update = () => {
            syncFromCarousel(mainCarouselApi);
        };

        update();
        mainCarouselApi.on("select", update);
        mainCarouselApi.on("reInit", update);

        return () => {
            mainCarouselApi.off("select", update);
            mainCarouselApi.off("reInit", update);
        };
    }, [mainCarouselApi, syncFromCarousel]);

    useEffect(() => {
        if (!lightboxCarouselApi) {
            return;
        }

        const update = () => {
            syncFromCarousel(lightboxCarouselApi);
        };

        update();
        lightboxCarouselApi.on("select", update);
        lightboxCarouselApi.on("reInit", update);

        return () => {
            lightboxCarouselApi.off("select", update);
            lightboxCarouselApi.off("reInit", update);
        };
    }, [lightboxCarouselApi, syncFromCarousel]);

    useEffect(() => {
        if (!imageCount || !mainCarouselApi || mainCarouselApi.selectedScrollSnap() === selectedIndex) {
            return;
        }

        mainCarouselApi.scrollTo(selectedIndex);
    }, [imageCount, mainCarouselApi, selectedIndex]);

    useEffect(() => {
        if (
            !imageCount ||
            !isLightboxOpen ||
            !lightboxCarouselApi ||
            lightboxCarouselApi.selectedScrollSnap() === selectedIndex
        ) {
            return;
        }

        lightboxCarouselApi.scrollTo(selectedIndex);
    }, [imageCount, isLightboxOpen, lightboxCarouselApi, selectedIndex]);

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia("(max-width: 639px)").matches) {
            return;
        }
        mobileThumbnailRefs.current.get(selectedIndex)?.scrollIntoView({
            block: "nearest",
            inline: "nearest",
            behavior: "smooth",
        });
    }, [selectedIndex]);

    useEffect(() => {
        if (!isLightboxOpen) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsLightboxOpen(false);
                return;
            }

            if (imageCount <= 1) {
                return;
            }

            if (event.key === "ArrowLeft") {
                event.preventDefault();
                if (lightboxCarouselApi) {
                    lightboxCarouselApi.scrollPrev();
                } else {
                    selectImage((selectedIndex - 1 + imageCount) % imageCount);
                }
            }

            if (event.key === "ArrowRight") {
                event.preventDefault();
                if (lightboxCarouselApi) {
                    lightboxCarouselApi.scrollNext();
                } else {
                    selectImage((selectedIndex + 1) % imageCount);
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [imageCount, isLightboxOpen, lightboxCarouselApi, selectImage, selectedIndex]);

    if (!selectedImage) {
        return (
            <section aria-label={t("sectionAria")} className="grid w-full min-w-0 gap-4 sm:block sm:max-w-[620px]">
                <ProductImageFallback className={galleryFrameClassName}/>
            </section>
        );
    }

    const renderThumbnail = (image: IProductImage, index: number, trackMobileVisibility = false) => {
        const imageNumber = index + 1;
        const imageFailed = failedImageUrls.includes(image.url);
        const isActive = index === selectedIndex;

        return (
            <button
                key={`${image.id}-${index}`}
                type="button"
                aria-label={t("showImage", {number: imageNumber})}
                aria-pressed={isActive}
                ref={trackMobileVisibility ? (node) => {
                    if (node) {
                        mobileThumbnailRefs.current.set(index, node);
                    } else {
                        mobileThumbnailRefs.current.delete(index);
                    }
                } : undefined}
                onClick={() => selectImage(index)}
                className={cn(
                    thumbnailClassName,
                    focusVisibleClassName,
                    isActive ? thumbnailActiveClassName : thumbnailInactiveClassName
                )}
            >
                {imageFailed ? (
                    <ProductImageFallback compact className="h-full w-full rounded-none border-0"/>
                ) : (
                    <Image
                        src={image.url}
                        alt={image.alt || t("thumbnailAlt", {name: productName, number: imageNumber})}
                        width={96}
                        height={96}
                        className="h-full w-full object-contain"
                        unoptimized
                        onError={() => markImageFailed(image.url)}
                    />
                )}
            </button>
        );
    };

    const openLightbox = (index: number) => {
        const image = orderedImages[index];
        if (!image || failedImageUrls.includes(image.url)) {
            return;
        }

        selectImage(index);
        setIsLightboxOpen(true);
    };

    return (
        <>
            <section
                aria-label={t("sectionAria")}
                className="grid w-full min-w-0 gap-3.5 sm:max-w-[760px] sm:grid-cols-[var(--spacing-product-gallery-rail-width)_minmax(0,1fr)] sm:items-start sm:gap-6"
            >
                <div
                    className={cn(
                        "hidden h-[var(--spacing-product-gallery-main-height)] w-[var(--spacing-product-gallery-rail-width)] flex-col items-center overflow-hidden sm:flex",
                        hasThumbnailOverflow ? "justify-between" : "justify-center"
                    )}
                    aria-label={t("thumbnailRailAria")}
                >
                    {hasThumbnailOverflow ? (
                        <button
                            type="button"
                            className={cn(thumbnailNavClassName, focusVisibleClassName)}
                            aria-label={t("previousThumbnails")}
                            disabled={!canScrollThumbnailsUp}
                            onClick={() => moveThumbnailWindow(-1)}
                        >
                            <ChevronUp className="size-6" aria-hidden="true"/>
                        </button>
                    ) : null}
                    <div className="max-h-[calc((var(--spacing-product-gallery-thumb-size)*5)+(var(--spacing-product-gallery-thumb-gap)*4))] overflow-hidden">
                        <div className="grid gap-[var(--spacing-product-gallery-thumb-gap)]">
                            {visibleThumbnails.map(({image, index}) => renderThumbnail(image, index))}
                        </div>
                    </div>
                    {hasThumbnailOverflow ? (
                        <button
                            type="button"
                            className={cn(thumbnailNavClassName, focusVisibleClassName)}
                            aria-label={t("nextThumbnails")}
                            disabled={!canScrollThumbnailsDown}
                            onClick={() => moveThumbnailWindow(1)}
                        >
                            <ChevronDown className="size-6" aria-hidden="true"/>
                        </button>
                    ) : null}
                </div>

                <Carousel
                    setApi={setMainCarouselApi}
                    opts={{align: "center", loop: imageCount > 1, duration: 10, startIndex: selectedIndex}}
                    className={cn("group min-w-0 bg-primary-bg", galleryFrameClassName)}
                >
                    <CarouselContent className="ml-0">
                        {orderedImages.map((image, index) => {
                            const imageFailed = failedImageUrls.includes(image.url);

                            return (
                                <CarouselItem key={`${image.id}-${index}`} className={cn("pl-0", galleryFrameClassName)}>
                                    <button
                                        type="button"
                                        aria-label={t("openZoom")}
                                        aria-disabled={imageFailed}
                                        onClick={() => openLightbox(index)}
                                        className={cn(
                                            "flex h-full w-full items-center justify-center border-0 bg-transparent [touch-action:pan-y]",
                                            imageFailed ? "cursor-default" : "cursor-zoom-in",
                                            focusVisibleClassName
                                        )}
                                    >
                                        {imageFailed ? (
                                            <ProductImageFallback className="h-full w-full rounded-none border-0"/>
                                        ) : (
                                            <Image
                                                src={image.url}
                                                alt={image.alt || productName}
                                                width={620}
                                                height={502}
                                                priority={index === 0}
                                                className="h-full w-full object-contain"
                                                unoptimized
                                                onError={() => markImageFailed(image.url)}
                                            />
                                        )}
                                    </button>
                                </CarouselItem>
                            );
                        })}
                    </CarouselContent>

                    {imageCount > 1 ? (
                        <nav aria-label={t("thumbnailRailAria")}>
                            <CarouselPrevious
                                setClassName
                                type="button"
                                aria-label={t("previousImage")}
                                className={cn(mainImageNavClassName, focusVisibleClassName, "left-2.5")}
                            >
                                <ChevronLeft className="size-6" aria-hidden="true"/>
                            </CarouselPrevious>
                            <CarouselNext
                                setClassName
                                type="button"
                                aria-label={t("nextImage")}
                                className={cn(mainImageNavClassName, focusVisibleClassName, "right-2.5")}
                            >
                                <ChevronRight className="size-6" aria-hidden="true"/>
                            </CarouselNext>
                        </nav>
                    ) : null}
                </Carousel>

                <div
                    className="flex min-w-0 gap-2.5 overflow-x-auto px-0.5 pb-2 pt-0.5 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch] sm:hidden"
                    aria-label={t("thumbnailRailAria")}
                >
                    {orderedImages.map((image, index) => renderThumbnail(image, index, true))}
                </div>
            </section>

            {isLightboxOpen ? (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={t("dialogAria")}
                    className="fixed inset-0 z-[1000] flex items-center justify-center bg-[var(--color-product-gallery-lightbox)] p-4"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    <button
                        type="button"
                        aria-label={t("closeZoom")}
                        className={cn(lightboxControlClassName, focusVisibleClassName, "right-4 top-4 size-11")}
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        <X className="size-6" aria-hidden="true"/>
                    </button>
                    <Carousel
                        setApi={setLightboxCarouselApi}
                        opts={{align: "center", loop: imageCount > 1, duration: 10, startIndex: selectedIndex}}
                        className="relative h-[86vh] w-[min(92vw,1180px)]"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <CarouselContent className="ml-0">
                            {orderedImages.map((image, index) => {
                                const imageFailed = failedImageUrls.includes(image.url);

                                return (
                                    <CarouselItem key={`${image.id}-${index}`} className="relative h-[86vh] pl-0">
                                        {imageFailed ? (
                                            <ProductImageFallback className="h-full w-full rounded-none border-0 bg-transparent text-text-inverse"/>
                                        ) : (
                                            <Image
                                                src={image.url}
                                                alt={image.alt || productName}
                                                fill
                                                sizes="92vw"
                                                className="object-contain"
                                                unoptimized
                                                onError={() => markImageFailed(image.url)}
                                            />
                                        )}
                                    </CarouselItem>
                                );
                            })}
                        </CarouselContent>
                        {imageCount > 1 ? (
                            <>
                                <CarouselPrevious
                                    setClassName
                                    type="button"
                                    aria-label={t("previousImage")}
                                    className={cn(lightboxControlClassName, focusVisibleClassName, "left-2.5 top-1/2 size-11 -translate-y-1/2 sm:left-4 sm:size-[50px]")}
                                >
                                    <ChevronLeft className="size-7" aria-hidden="true"/>
                                </CarouselPrevious>
                                <CarouselNext
                                    setClassName
                                    type="button"
                                    aria-label={t("nextImage")}
                                    className={cn(lightboxControlClassName, focusVisibleClassName, "right-2.5 top-1/2 size-11 -translate-y-1/2 sm:right-4 sm:size-[50px]")}
                                >
                                    <ChevronRight className="size-7" aria-hidden="true"/>
                                </CarouselNext>
                            </>
                        ) : null}
                    </Carousel>
                    <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3.5 py-2 text-xs leading-none text-text-heading-primary">
                        {t("imageCounter", {current: selectedIndex + 1, total: imageCount})}
                    </span>
                </div>
            ) : null}
        </>
    );
};

export default ProductGallery;
