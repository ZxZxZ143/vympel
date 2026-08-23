import {renderToStaticMarkup} from "react-dom/server";
import type {ReactNode} from "react";
import {beforeEach, describe, expect, it, vi} from "vitest";

const {autoplayHandlers, autoplaySpy, bannerItemSpy, carouselSpy, lifecycleSpy} = vi.hoisted(() => {
    const autoplayHandlers = {
        onPointerEnter: vi.fn(),
        onPointerLeave: vi.fn(),
        onPointerDownCapture: vi.fn(),
        onPointerUpCapture: vi.fn(),
        onPointerCancelCapture: vi.fn(),
        onKeyDown: vi.fn(),
        onFocusCapture: vi.fn(),
        onBlurCapture: vi.fn(),
    };
    return {
        autoplayHandlers,
        autoplaySpy: vi.fn(() => ({name: "autoplay"})),
        bannerItemSpy: vi.fn(),
        carouselSpy: vi.fn(),
        lifecycleSpy: vi.fn(() => autoplayHandlers),
    };
});

vi.mock("@/components/ui/Carousel", () => ({
    Carousel: (props: {children: ReactNode}) => {
        carouselSpy(props);
        return <div>{props.children}</div>;
    },
    CarouselContent: ({children}: {children: ReactNode}) => <div>{children}</div>,
    CarouselItem: ({children}: {children: ReactNode}) => <div>{children}</div>,
    CarouselPrevious: () => null,
    CarouselNext: () => null,
}));

vi.mock("embla-carousel-autoplay", () => ({default: autoplaySpy}));
vi.mock("@/components/ui/shared/CarouselDots", () => ({default: () => null}));
vi.mock("@/components/HomePage/bannerCarousel/Item", () => ({
    default: (props: {priority?: boolean}) => {
        bannerItemSpy(props);
        return <span data-priority={String(Boolean(props.priority))}/>;
    },
}));
vi.mock("@/hooks/useCarouselAutoplayLifecycle", () => ({
    useCarouselAutoplayLifecycle: lifecycleSpy,
}));
vi.mock("use-intl", () => ({useTranslations: () => (key: string) => key}));

import BannerCarousel from "@/components/HomePage/bannerCarousel";

describe("BannerCarousel image priority", () => {
    beforeEach(() => {
        autoplaySpy.mockClear();
        bannerItemSpy.mockClear();
        carouselSpy.mockClear();
        lifecycleSpy.mockClear();
        Object.values(autoplayHandlers).forEach((handler) => handler.mockClear());
    });

    it("prioritizes only the initial foreground slide", () => {
        renderToStaticMarkup(
            <BannerCarousel items={[
                {id: 1, url: "/one.webp", alt: "One"},
                {id: 2, url: "/two.webp", alt: "Two"},
                {id: 3, url: "/three.webp", alt: "Three"},
            ]}/>
        );

        expect(bannerItemSpy.mock.calls.map(([props]) => props.priority)).toEqual([true, false, false]);
    });

    it("does not render a Play/Pause control and enables autoplay for multiple slides", () => {
        const markup = renderToStaticMarkup(
            <BannerCarousel items={[
                {id: 1, url: "/one.webp", alt: "One"},
                {id: 2, url: "/two.webp", alt: "Two"},
            ]}/>
        );

        expect(markup).not.toContain("<button");
        expect(markup).not.toContain("data-carousel-autoplay-control");
        expect(markup).not.toContain("pauseAutoplay");
        expect(markup).not.toContain("resumeAutoplay");
        expect(autoplaySpy).toHaveBeenCalledWith(expect.objectContaining({
            delay: 5000,
            playOnInit: false,
            stopOnFocusIn: false,
            stopOnInteraction: true,
            stopOnMouseEnter: false,
        }));
        expect(lifecycleSpy).toHaveBeenCalledWith(undefined, expect.any(Object), true);
        const carouselProps = carouselSpy.mock.calls[0][0];
        expect(carouselProps.plugins).toHaveLength(1);
        expect(carouselProps.onKeyDown).toBe(autoplayHandlers.onKeyDown);
        expect(carouselProps.onKeyDownCapture).toBeUndefined();
        expect(carouselProps.onPointerDownCapture).toBe(autoplayHandlers.onPointerDownCapture);
    });

    it("does not initialize autoplay behavior for a single slide", () => {
        renderToStaticMarkup(
            <BannerCarousel items={[{id: 1, url: "/one.webp", alt: "One"}]}/>
        );

        expect(lifecycleSpy).toHaveBeenCalledWith(undefined, expect.any(Object), false);
        expect(carouselSpy.mock.calls[0][0].plugins).toEqual([]);
    });
});
