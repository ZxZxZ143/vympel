"use client";

import React, {FC, PropsWithChildren, useRef} from "react";
import gsap from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import {SplitText} from "gsap/SplitText";
import {useGSAP} from "@gsap/react";
import {
    HOME_MOTION,
    HOME_MOTION_QUERIES,
    HomeMotionConditions,
    isHorizontallyVisible,
    partitionByHorizontalVisibility,
    readMotionNumber,
    unveilClipPath,
} from "@/components/HomePage/HomeMotion/motion";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

type Props = {
    className?: string;
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

const setupHomeMotion = (root: HTMLElement, context: gsap.Context, desktop: boolean) => {
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

    setupHeroParallax(root);
    setupReveals(root, desktop, pending);
    setupMediaUnveils(root, pending);
    if (desktop) setupParallax(root);

    const lineTargets = prepareLineReveals(root, pending);
    document.fonts.ready.then(() => {
        if (!active) return;
        context.add(() => playLineReveals(lineTargets, pending));
        ScrollTrigger.refresh();
    });

    root.addEventListener("focusin", revealFocused);

    return () => {
        active = false;
        root.removeEventListener("focusin", revealFocused);
        pending.clear();
    };
};

const HomeMotion: FC<PropsWithChildren<Props>> = ({className, children}) => {
    const rootRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        const root = rootRef.current;
        if (!root) return;

        gsap.matchMedia().add(HOME_MOTION_QUERIES, (context) => {
            const {motion, desktop} = context.conditions as HomeMotionConditions;
            if (!motion) return;

            return setupHomeMotion(root, context, desktop);
        });
    }, {scope: rootRef});

    return (
        <div ref={rootRef} className={className}>
            {children}
        </div>
    );
};

export default HomeMotion;
