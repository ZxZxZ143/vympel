import {readFileSync} from "node:fs";
import {describe, expect, it} from "vitest";

function source(path: string) {
    return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("confirmed accessibility and semantics regressions", () => {
    it("keeps disclosure content conditional and branding out of the heading outline", () => {
        const header = source("components/ui/layout/Header/index.tsx");
        const navigation = source("components/ui/layout/Navigation/index.tsx");
        expect(header).not.toContain('role="menu"');
        expect(header).toContain("isLangOpen ? (");
        expect(header).toContain('<Text as="span" font="heading"');
        expect(navigation).not.toContain('role="menu"');
        expect(navigation).toContain("DialogPrimitive.Root");
        expect(navigation).toContain("brandsTriggerRef.current?.focus()");
    });

    it("uses focus-managed dialogs and complete tabs semantics", () => {
        const gallery = source("components/ProductPage/ProductGallery/index.tsx");
        const tabs = source("components/ProductPage/ProductInfoTabs/index.tsx");
        expect(gallery).toContain("DialogPrimitive.Content");
        expect(gallery).toContain('role="group"');
        expect(gallery).not.toContain('role="dialog"');
        expect(tabs).toContain("tabIndex={isActive ? 0 : -1}");
        for (const key of ["ArrowRight", "ArrowLeft", "Home", "End"]) expect(tabs).toContain(key);
    });

    it("keeps off-screen slides inert and carousel pickers as ordinary buttons", () => {
        const carousel = source("components/ui/Carousel.tsx");
        const dots = source("components/ui/shared/CarouselDots/index.tsx");
        expect(carousel).toContain("slidesInView()");
        expect(carousel).toContain('api.on("slidesInView", onSelect)');
        expect(carousel).toContain("api.selectedScrollSnap()");
        expect(carousel).toContain("inert={!isVisible ? true : undefined}");
        expect(dots).toContain('role="group"');
        expect(dots).not.toContain('role="tab"');
    });

    it("limits autoplay to the reduced-motion-aware hover-pausing home hero", () => {
        const banner = source("components/HomePage/bannerCarousel/index.tsx");
        const autoplay = source("components/HomePage/bannerCarousel/autoplay.ts");
        const autoplayLifecycle = source("hooks/useCarouselAutoplayLifecycle.ts");
        expect(banner).toContain("createHomeBannerAutoplay");
        expect(banner).toContain("useCarouselAutoplayLifecycle");
        expect(banner).not.toContain("data-carousel-autoplay-control");
        expect(banner).not.toContain("pauseAutoplay");
        expect(banner).not.toContain("resumeAutoplay");
        expect(autoplay).toContain("delay: 5000");
        expect(autoplay).toContain("stopOnInteraction: true");
        expect(autoplayLifecycle).toContain('matchMedia("(prefers-reduced-motion: reduce)")');
        expect(autoplayLifecycle).toContain('api.on("pointerDown", lifecycle.dragStart)');
        expect(autoplayLifecycle).toContain('api.on("pointerUp", lifecycle.dragEnd)');
        expect(autoplayLifecycle).toContain('pointerType === "mouse"');

        for (const path of [
            "components/HomePage/BrandsCarousel/index.tsx",
            "components/AboutPage/InstagramSlider/index.tsx",
            "components/ui/shared/GoodsCarouselWithImage/index.tsx",
            "components/ProductPage/ProductGallery/index.tsx",
            "components/ProductPage/ProductRecommendations/index.tsx",
        ]) {
            const component = source(path);
            expect(component).not.toContain("embla-carousel-autoplay");
            expect(component).not.toContain("Autoplay(");
        }
        const item = source("components/HomePage/bannerCarousel/Item/index.tsx");
        expect(banner).toContain("priority={index === 0}");
        expect(item.match(/priority=\{priority\}/g)).toHaveLength(1);
    });

    it("associates form errors and preserves post-removal focus targets", () => {
        const request = source("components/CustomerRequestDialog/CustomerRequestDialogProvider.tsx");
        const reviews = source("components/ProductPage/ProductReviews/index.tsx");
        const cart = source("screens/CartPage/index.tsx");
        const favorites = source("screens/FavoritesPage/index.tsx");
        for (const component of [request, reviews]) {
            expect(component).toContain("aria-invalid");
            expect(component).toContain("aria-describedby");
            expect(component).toContain('role="alert"');
        }
        expect(cart).toContain("onCloseAutoFocus={restoreMutationFocus}");
        expect(cart).toContain("data-cart-remove-id");
        expect(favorites).toContain("data-favorite-product-id");
        expect(favorites).toContain("pendingFocusRef");
    });

    it("only references popup IDs while the controlled popup is mounted", () => {
        const search = source("components/ui/shared/SmartSearch/index.tsx");
        const dropdown = source("components/ui/shared/DropdownSelect/index.tsx");
        const imageFallback = source("components/ui/shared/ProductImageFallback/index.tsx");
        expect(search).toContain("aria-controls={isSearchOpen ? panelId : undefined}");
        expect(dropdown).toContain("aria-controls={isOpen ? listboxId : undefined}");
        expect(imageFallback).not.toContain("aria-label");
    });

    it("removes false stock notification and decouples headings from actions", () => {
        const summary = source("components/ProductPage/ProductSummary/index.tsx");
        const globals = source("app/globals.css");
        const card = source("components/GoodCard/index.tsx");
        const goods = source("components/ui/shared/GoodsCarouselWithImage/index.tsx");
        expect(summary).not.toContain("submitStockNotify");
        expect(summary).toContain("product_availability_question");
        expect(summary).not.toContain("productMarketplaceLinks");
        expect(summary).not.toContain("buyOnMarketplace");
        expect(summary).not.toContain("MARKETPLACE_CLICK");
        expect(summary.match(/mt-product-summary-actions-gap/g)).toHaveLength(2);
        expect(globals).toContain("--spacing-product-summary-actions-gap: 28px");
        expect(card).toContain('headingLevel?: "h2" | "h3"');
        expect(goods).toContain('headingLevel="h3"');
        expect(goods).toContain("loading?: boolean");
    });
});

describe("localized accessibility copy", () => {
    it("has no known RU/KZ English fallback leakage", () => {
        for (const locale of ["ru", "kz", "en"] as const) {
            const messages = JSON.parse(source(`messages/${locale}.json`));
            expect(messages.benefits.title).toBeTruthy();
            expect(messages.carousel.previous).toBeTruthy();
            expect(messages.bannerCarousel.pauseAutoplay).toBeUndefined();
            expect(messages.bannerCarousel.resumeAutoplay).toBeUndefined();
            expect(messages.carousel.stopRotation).toBeUndefined();
            expect(messages.carousel.startRotation).toBeUndefined();
            if (locale !== "en") {
                expect(messages.benefits.title).not.toBe("Benefits");
                expect(messages.requestDialog.placeholders.name).not.toBe("Dear User");
            }
        }
    });
});
