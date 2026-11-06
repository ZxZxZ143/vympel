"use client";

import React, {FC, PropsWithChildren, useRef} from "react";
import gsap from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import {SplitText} from "gsap/SplitText";
import {useGSAP} from "@gsap/react";
import {
    HOME_MOTION,
    HOME_MOTION_QUERIES,
    HOME_MOTION_VARIANTS,
    HomeMotionConditions,
    HomeMotionVariant,
    isHorizontallyVisible,
    partitionByHorizontalVisibility,
    readMotionNumber,
    unveilClipPath,
} from "@/components/HomePage/HomeMotion/motion";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

type Props = {
    className?: string;
    variant?: HomeMotionVariant;
};

type PendingReveals = Map<Element, () => void>;

const query = (root: ParentNode, selector: string) => Array.from(root.querySelectorAll<HTMLElement>(selector));

const isOffscreen = (element: Element) => !ScrollTrigger.isInViewport(element);

const setupHeroParallax = (root: HTMLElement) => {
    const hero = root.querySelector<HTMLElement>('[data-motion="hero"]');
    if (!hero) return;

    gsap.fromTo(
        query(hero, ".responsive-home-banner-frame > picture"),
        {yPercent: 0, scale: 1},
        {
            ...HOME_MOTION.heroParallax,
            ease: "none",
            scrollTrigger: {trigger: hero, start: "top top", end: "bottom top", scrub: HOME_MOTION.heroScrub},
        }
    );
};

const setupReveals = (root: HTMLElement, desktop: boolean, pending: PendingReveals) => {
    const items = [
        ...query(root, '[data-motion="reveal"]'),
        ...query(root, '[data-motion="stagger"]').flatMap((group) => Array.from(group.children) as HTMLElement[]),
    ].filter(isOffscreen);
    if (!items.length) return;

    const distance = desktop ? HOME_MOTION.revealDistance.desktop : HOME_MOTION.revealDistance.mobile;
    const playReveal = (item: HTMLElement, delay: number) => {
        const inner = query(item, "[data-motion-inner]");
        const timeline = gsap.timeline({
            delay,
            onComplete: () => {
                pending.delete(item);
                gsap.set([item, ...inner], {clearProps: "opacity,transform"});
            },
        });

        timeline.to(item, {opacity: 1, y: 0, duration: HOME_MOTION.revealDuration, ease: HOME_MOTION.ease});
        if (inner.length) {
            timeline.to(
                inner,
                {opacity: 1, scale: 1, duration: HOME_MOTION.innerDuration, ease: HOME_MOTION.ease},
                HOME_MOTION.innerDelay
            );
        }
        pending.set(item, () => timeline.progress(1));
        return timeline;
    };

    items.forEach((item) => {
        gsap.set(item, {opacity: 0, y: distance});
        gsap.set(query(item, "[data-motion-inner]"), {opacity: 0, scale: HOME_MOTION.innerScale});
        pending.set(item, () => playReveal(item, 0).progress(1));
    });

    ScrollTrigger.batch(items, {
        start: HOME_MOTION.start,
        once: true,
        onEnter: (batch) => {
            const waiting = (batch as HTMLElement[]).filter((item) => pending.has(item));
            const {visible, hidden} = partitionByHorizontalVisibility(waiting, window.innerWidth);
            hidden.forEach((item) => playReveal(item, 0).progress(1));
            visible.forEach((item, index) => playReveal(item, index * HOME_MOTION.stagger));
        },
    });
};

const setupMediaUnveils = (root: HTMLElement, pending: PendingReveals) => {
    query(root, '[data-motion="media"]').filter(isOffscreen).forEach((media) => {
        const image = media.querySelector("img");
        const timeline = gsap.timeline({
            scrollTrigger: {
                trigger: media,
                start: HOME_MOTION.start,
                once: true,
                onEnter: (self) => {
                    if (!isHorizontallyVisible(media.getBoundingClientRect(), window.innerWidth)) {
                        self.animation?.progress(1);
                    }
                },
            },
            onComplete: () => {
                pending.delete(media);
                gsap.set([media, image].filter(Boolean), {clearProps: "clipPath,transform"});
            },
        });

        timeline.fromTo(
            media,
            {clipPath: unveilClipPath(media.dataset.motionDirection)},
            {clipPath: "inset(0% 0% 0% 0%)", duration: HOME_MOTION.unveilDuration, ease: HOME_MOTION.unveilEase}
        );
        if (image) {
            timeline.fromTo(
                image,
                {scale: HOME_MOTION.mediaScale},
                {scale: 1, duration: HOME_MOTION.settleDuration, ease: HOME_MOTION.ease},
                HOME_MOTION.settleDelay
            );
        }
        pending.set(media, () => timeline.progress(1));
    });
};

const setupParallax = (root: HTMLElement) => {
    query(root, '[data-motion="parallax"]').forEach((layer) => {
        const travel = readMotionNumber(layer.dataset.motionY, HOME_MOTION.parallaxTravel);
        const rotation = readMotionNumber(layer.dataset.motionRotate, 0);

        gsap.fromTo(
            layer,
            {y: travel / 2, rotation: -rotation / 2},
            {
                y: -travel / 2,
                rotation: rotation / 2,
                ease: "none",
                scrollTrigger: {
                    trigger: layer.parentElement ?? layer,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: HOME_MOTION.parallaxScrub,
                },
            }
        );
    });
};

const prepareLineReveals = (root: HTMLElement, pending: PendingReveals) => {
    const targets = query(root, '[data-motion="title"], [data-motion="lines"]').filter(isOffscreen);

    targets.forEach((target) => {
        gsap.set(target, {opacity: 0});
        pending.set(target, () => gsap.set(target, {opacity: 1}));
    });

    return targets;
};

const playLineReveals = (targets: HTMLElement[], pending: PendingReveals) => {
    targets.forEach((target) => {
        if (!pending.has(target)) return;

        const isTitle = target.dataset.motion === "title";
        const link = isTitle
            ? target.parentElement?.querySelector<HTMLElement>('[data-motion="title-link"]')
            : null;
        const split = SplitText.create(target, {
            type: "lines",
            mask: "lines",
            aria: "none",
            linesClass: "home-motion-line",
        });
        const timeline = gsap.timeline({
            scrollTrigger: {trigger: target, start: HOME_MOTION.start, once: true},
            onComplete: () => {
                split.revert();
                pending.delete(target);
                if (link) pending.delete(link);
            },
        });

        gsap.set(target, {opacity: 1});
        timeline.from(split.lines, {
            yPercent: 110,
            duration: HOME_MOTION.linesDuration,
            ease: HOME_MOTION.ease,
            stagger: isTitle ? HOME_MOTION.titleLineStagger : HOME_MOTION.textLineStagger,
        });
        if (link) {
            timeline.from(
                link,
                {
                    opacity: 0,
                    x: -HOME_MOTION.titleLinkDistance,
                    duration: HOME_MOTION.revealDuration,
                    ease: HOME_MOTION.ease,
                    clearProps: "opacity,transform",
                },
                HOME_MOTION.titleLinkDelay
            );
            pending.set(link, () => timeline.progress(1));
        }
        pending.set(target, () => timeline.progress(1));
    });
};

// Trigger positions are measured once; when the document height changes (filters, pagination, streamed or
// lazily sized content), re-measure so a moved section can still cross its start and never stays hidden.
const observeDocumentHeight = () => {
    if (typeof ResizeObserver === "undefined") return () => undefined;

    let timer: number | undefined;
    const observer = new ResizeObserver(() => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => ScrollTrigger.refresh(), HOME_MOTION.refreshDelay);
    });
    observer.observe(document.body);

    return () => {
        window.clearTimeout(timer);
        observer.disconnect();
    };
};

const setupHomeMotion = (
    root: HTMLElement,
    context: gsap.Context,
    desktop: boolean,
    variant: HomeMotionVariant,
) => {
    const effects = HOME_MOTION_VARIANTS[variant];
    const pending: PendingReveals = new Map();
    let active = true;

    // Focus can land on content that has not scrolled past its trigger yet; reveal it instantly.
    const revealFocused = (event: FocusEvent) => {
        for (let node = event.target as Element | null; node && node !== root; node = node.parentElement) {
            const reveal = pending.get(node);
            if (reveal) {
                pending.delete(node);
                reveal();
            }
        }
    };

    if (effects.heroParallax) setupHeroParallax(root);
    setupReveals(root, desktop, pending);
    if (effects.mediaUnveils) setupMediaUnveils(root, pending);
    if (effects.parallax && desktop) setupParallax(root);

    if (effects.lineReveals) {
        const lineTargets = prepareLineReveals(root, pending);
        document.fonts.ready.then(() => {
            if (!active) return;
            context.add(() => playLineReveals(lineTargets, pending));
            ScrollTrigger.refresh();
        });
    }

    root.addEventListener("focusin", revealFocused);
    const stopObservingHeight = observeDocumentHeight();

    return () => {
        active = false;
        stopObservingHeight();
        root.removeEventListener("focusin", revealFocused);
        pending.clear();
    };
};

const HomeMotion: FC<PropsWithChildren<Props>> = ({className, variant = "full", children}) => {
    const rootRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        const root = rootRef.current;
        if (!root) return;

        gsap.matchMedia().add(HOME_MOTION_QUERIES, (context) => {
            const {motion, desktop} = context.conditions as HomeMotionConditions;
            if (!motion) return;

            return setupHomeMotion(root, context, desktop, variant);
        });
    }, {scope: rootRef, dependencies: [variant]});

    return (
        <div ref={rootRef} className={className}>
            {children}
        </div>
    );
};

export default HomeMotion;
