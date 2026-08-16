import {renderToStaticMarkup} from "react-dom/server";
import type {ReactNode} from "react";
import {beforeEach, describe, expect, it, vi} from "vitest";

const {bannerItemSpy} = vi.hoisted(() => ({bannerItemSpy: vi.fn()}));

vi.mock("@/components/ui/Carousel", () => ({
    Carousel: ({children}: {children: ReactNode}) => <div>{children}</div>,
    CarouselContent: ({children}: {children: ReactNode}) => <div>{children}</div>,
    CarouselItem: ({children}: {children: ReactNode}) => <div>{children}</div>,
    CarouselPrevious: () => null,
    CarouselNext: () => null,
}));

vi.mock("embla-carousel-autoplay", () => ({default: () => ({})}));
vi.mock("@/components/ui/shared/CarouselDots", () => ({default: () => null}));
vi.mock("@/components/HomePage/bannerCarousel/Item", () => ({
    default: (props: {priority?: boolean}) => {
        bannerItemSpy(props);
        return <span data-priority={String(Boolean(props.priority))}/>;
    },
}));
vi.mock("@/hooks/useCarouselAutoplayControl", () => ({
    useCarouselAutoplayControl: () => ({
        isPlaying: false,
        autoplayAllowed: false,
        pauseAutoplay: vi.fn(),
        resumeAutoplay: vi.fn(),
    }),
}));
vi.mock("use-intl", () => ({useTranslations: () => (key: string) => key}));

import BannerCarousel from "@/components/HomePage/bannerCarousel";

describe("BannerCarousel image priority", () => {
    beforeEach(() => bannerItemSpy.mockClear());

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
});
