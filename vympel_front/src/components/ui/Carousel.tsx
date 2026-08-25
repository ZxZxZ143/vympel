"use client"

import * as React from "react"
import useEmblaCarousel, {
    type UseEmblaCarouselType,
} from "embla-carousel-react"
import {ArrowLeft, ArrowRight} from "lucide-react"

import {cn} from "@/lib/utils"
import {LibButton} from "@/components/ui/libButton"
import {PropsWithChildren} from "react";
import {useTranslations} from "use-intl";

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

type CarouselProps = {
    opts?: CarouselOptions
    plugins?: CarouselPlugin
    orientation?: "horizontal" | "vertical"
    setApi?: (api: CarouselApi) => void
}

type CarouselContextProps = {
    carouselRef: ReturnType<typeof useEmblaCarousel>[0]
    api: ReturnType<typeof useEmblaCarousel>[1]
    scrollPrev: () => void
    scrollNext: () => void
    canScrollPrev: boolean
    canScrollNext: boolean
    visibleSlideIndexes: ReadonlySet<number>
    slideCount: number
    previousLabel: string
    nextLabel: string
    slideLabel: (index: number, total: number) => string
    slideRoleDescription: string
} & CarouselProps

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
    const context = React.useContext(CarouselContext)

    if (!context) {
        throw new Error("useCarousel must be used within a <Carousel />")
    }

    return context
}

function Carousel({
                      orientation = "horizontal",
                      opts,
                      setApi,
                      plugins,
                      className,
                      children,
                      "aria-label": ariaLabel,
                      ...props
                  }: React.ComponentProps<"div"> & CarouselProps) {
    const [carouselRef, api] = useEmblaCarousel(
        {
            ...opts,
            axis: orientation === "horizontal" ? "x" : "y",
        },
        plugins
    )
    const [canScrollPrev, setCanScrollPrev] = React.useState(false)
    const [canScrollNext, setCanScrollNext] = React.useState(false)
    const [visibleSlideIndexes, setVisibleSlideIndexes] = React.useState<ReadonlySet<number>>(() => new Set([0]))
    const [slideCount, setSlideCount] = React.useState(0)
    const rootRef = React.useRef<HTMLDivElement>(null)
    const t = useTranslations("carousel")

    const onSelect = React.useCallback((api: CarouselApi) => {
        if (!api) return
        setCanScrollPrev(api.canScrollPrev())
        setCanScrollNext(api.canScrollNext())
        const nextVisible = new Set(api.slidesInView())
        if (nextVisible.size === 0 && api.slideNodes().length > 0) {
            nextVisible.add(api.selectedScrollSnap())
        }
        setSlideCount(api.slideNodes().length)
        setVisibleSlideIndexes(nextVisible)

        const activeElement = document.activeElement
        const activeSlide = activeElement instanceof Element
            ? activeElement.closest<HTMLElement>("[data-carousel-index]")
            : null
        const activeIndex = Number(activeSlide?.dataset.carouselIndex)
        if (activeSlide && !nextVisible.has(activeIndex)) {
            rootRef.current?.focus({preventScroll: true})
        }
    }, [])

    const scrollPrev = React.useCallback(() => {
        api?.scrollPrev()
    }, [api])

    const scrollNext = React.useCallback(() => {
        api?.scrollNext()
    }, [api])

    const handleKeyDown = React.useCallback(
        (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (event.key === "ArrowLeft") {
                event.preventDefault()
                scrollPrev()
            } else if (event.key === "ArrowRight") {
                event.preventDefault()
                scrollNext()
            }
        },
        [scrollPrev, scrollNext]
    )

    React.useEffect(() => {
        if (!api || !setApi) return
        setApi(api)
    }, [api, setApi])

    React.useEffect(() => {
        if (!api) return
        const initialSelection = window.setTimeout(() => onSelect(api), 0)
        api.on("reInit", onSelect)
        api.on("select", onSelect)
        api.on("slidesInView", onSelect)

        return () => {
            window.clearTimeout(initialSelection)
            api.off("reInit", onSelect)
            api.off("select", onSelect)
            api.off("slidesInView", onSelect)
        }
    }, [api, onSelect])

    return (
        <CarouselContext.Provider
            value={{
                carouselRef,
                api: api,
                opts,
                orientation:
                    orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
                scrollPrev,
                scrollNext,
                canScrollPrev,
                canScrollNext,
                visibleSlideIndexes,
                slideCount,
                previousLabel: t("previous"),
                nextLabel: t("next"),
                slideLabel: (index, total) => t("slide", {index: index + 1, total}),
                slideRoleDescription: t("slideRoleDescription"),
            }}
        >
            <div
                ref={rootRef}
                tabIndex={-1}
                onKeyDownCapture={handleKeyDown}
                className={cn("relative", className)}
                role="region"
                aria-label={ariaLabel ?? t("region")}
                aria-roledescription={t("roleDescription")}
                data-slot="carousel"
                {...props}
            >
                {children}
            </div>
        </CarouselContext.Provider>
    )
}

function CarouselContent({className, children, ...props}: React.ComponentProps<"div">) {
    const {carouselRef, orientation} = useCarousel()
    const total = React.Children.count(children)
    const indexedChildren = React.Children.map(children, (child, index) => (
        React.isValidElement(child)
            ? React.cloneElement(child as React.ReactElement<{slideIndex?: number; slideTotal?: number}>, {slideIndex: index, slideTotal: total})
            : child
    ))

    return (
        <div
            ref={carouselRef}
            className="overflow-hidden"
            data-slot="carousel-content"
        >
            <div
                className={cn(
                    "flex",
                    orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
                    className
                )}
                {...props}
            >
                {indexedChildren}
            </div>
        </div>
    )
}

function CarouselItem({className, slideIndex = 0, slideTotal = 1, "aria-label": ariaLabel, ...props}: React.ComponentProps<"div"> & {slideIndex?: number; slideTotal?: number}) {
    const {orientation, visibleSlideIndexes, slideCount, slideLabel, slideRoleDescription} = useCarousel()
    const isVisible = visibleSlideIndexes.has(slideIndex)

    return (
        <div
            role="group"
            aria-roledescription={slideRoleDescription}
            aria-label={ariaLabel ?? slideLabel(slideIndex, slideCount || slideTotal)}
            aria-hidden={!isVisible}
            inert={!isVisible ? true : undefined}
            data-carousel-index={slideIndex}
            data-slot="carousel-item"
            className={cn(
                "min-w-0 shrink-0 grow-0 basis-full",
                orientation === "horizontal" ? "pl-4" : "pt-4",
                className
            )}
            {...props}
        />
    )
}

function CarouselPrevious({
                              className,
                              variant = "outline",
                              size = "icon",
                              children,
                              setClassName = false,
                              "aria-label": ariaLabel,
                              ...props
                          }: PropsWithChildren<React.ComponentProps<typeof LibButton>> & { setClassName?: boolean }) {
    const { orientation, scrollPrev, canScrollPrev, previousLabel } = useCarousel()

    const classes = cn(
        {
            ["absolute z-10 size-8 rounded-full"]: !setClassName,
            ["top-1/2 -left-12 -translate-y-1/2"]: !setClassName && orientation === "horizontal",
            ["-top-12 left-1/2 -translate-x-1/2 rotate-90"]: !setClassName && orientation === "vertical",
        },
        className
    )

    return setClassName ? (
        <button
            type="button"
            data-slot="carousel-previous"
            className={classes}
            disabled={!canScrollPrev}
            onClick={scrollPrev}
            aria-label={ariaLabel ?? previousLabel}
            {...props}
        >
            {children ? (
                children
            ) : (
                <>
                    <ArrowLeft />
                    <span className="sr-only">Previous slide</span>
                </>
            )}
        </button>
    ) : (
        <LibButton
            data-slot="carousel-previous"
            variant={variant}
            size={size}
            className={classes}
            disabled={!canScrollPrev}
            onClick={scrollPrev}
            aria-label={ariaLabel ?? previousLabel}
            {...props}
        >
            {children ? (
                children
            ) : (
                <>
                    <ArrowLeft />
                    <span className="sr-only">Previous slide</span>
                </>
            )}
        </LibButton>
    )
}

function CarouselNext({
                          className,
                          variant = "outline",
                          size = "icon",
                          children,
                          setClassName = false,
                          "aria-label": ariaLabel,
                          ...props
                      }: PropsWithChildren<React.ComponentProps<typeof LibButton>> & { setClassName?: boolean }) {
    const { orientation, scrollNext, canScrollNext, nextLabel } = useCarousel()

    const classes = cn(
        {
            ["absolute z-10 size-8 rounded-full"]: !setClassName,
            ["top-1/2 -right-12 -translate-y-1/2"]: !setClassName && orientation === "horizontal",
            ["-bottom-12 left-1/2 -translate-x-1/2 rotate-90"]: !setClassName && orientation === "vertical",
        },
        className
    )

    return setClassName ? (
        <button
            type="button"
            data-slot="carousel-next"
            className={classes}
            disabled={!canScrollNext}
            onClick={scrollNext}
            aria-label={ariaLabel ?? nextLabel}
            {...props}
        >
            {children ? (
                children
            ) : (
                <>
                    <ArrowRight />
                    <span className="sr-only">Next slide</span>
                </>
            )}
        </button>
    ) : (
        <LibButton
            data-slot="carousel-next"
            variant={variant}
            size={size}
            className={classes}
            disabled={!canScrollNext}
            onClick={scrollNext}
            aria-label={ariaLabel ?? nextLabel}
            {...props}
        >
            {children ? (
                children
            ) : (
                <>
                    <ArrowRight />
                    <span className="sr-only">Next slide</span>
                </>
            )}
        </LibButton>
    )
}

export {
    type CarouselApi,
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
}
