// GSAP power4 is the quint curve: power4.out equals --ease-vympel and power4.inOut equals --ease-vympel-unveil.
export const HOME_MOTION = {
    ease: "power4.out",
    unveilEase: "power4.inOut",
    start: "top 88%",
    revealDuration: 1.2,
    revealDistance: {desktop: 56, mobile: 32},
    stagger: 0.1,
    innerDuration: 1.4,
    innerDelay: 0.15,
    innerScale: 0.86,
    linesDuration: 1.1,
    titleLineStagger: 0.1,
    textLineStagger: 0.06,
    titleLinkDelay: 0.2,
    titleLinkDistance: 16,
    unveilDuration: 1.5,
    // The in-out wipe barely opens during its first quarter, so the image settle starts with the visible part.
    settleDelay: 0.35,
    settleDuration: 2,
    mediaScale: 1.25,
    parallaxTravel: 80,
    parallaxScrub: 1,
    heroScrub: 0.6,
    // yPercent must stay below half of the extra scale so the frame never exposes an edge.
    heroParallax: {yPercent: 5, scale: 1.12},
} as const;

export const HOME_MOTION_QUERIES = {
    motion: "(prefers-reduced-motion: no-preference)",
    desktop: "(min-width: 1024px)",
} as const;

export type HomeMotionConditions = Record<keyof typeof HOME_MOTION_QUERIES, boolean>;

type HorizontalBox = Pick<DOMRect, "left" | "right">;

export const isHorizontallyVisible = ({left, right}: HorizontalBox, viewportWidth: number) =>
    right > 0 && left < viewportWidth;

export const partitionByHorizontalVisibility = <T extends Element>(
    elements: T[],
    viewportWidth: number,
    measure: (element: T) => HorizontalBox = (element) => element.getBoundingClientRect(),
) => {
    const visible: T[] = [];
    const hidden: T[] = [];

    elements.forEach((element) => {
        (isHorizontallyVisible(measure(element), viewportWidth) ? visible : hidden).push(element);
    });

    return {visible, hidden};
};

export const readMotionNumber = (value: string | undefined, fallback: number) => {
    if (value === undefined || value.trim() === "") return fallback;

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

export const unveilClipPath = (direction: string | undefined) =>
    direction === "left" ? "inset(0% 100% 0% 0%)" : "inset(0% 0% 100% 0%)";
