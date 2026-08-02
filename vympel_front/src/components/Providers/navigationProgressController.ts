"use client";

import NProgress from "nprogress";

const PROGRESS_FAILSAFE_MS = 15_000;

let progressActive = false;
let progressFailsafe: ReturnType<typeof setTimeout> | null = null;

function clearProgressFailsafe() {
    if (progressFailsafe !== null) {
        clearTimeout(progressFailsafe);
        progressFailsafe = null;
    }
}

export function configureNavigationProgress(): () => void {
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const applyConfiguration = () => {
        const reducedMotion = reducedMotionQuery.matches;

        NProgress.configure({
            showSpinner: false,
            minimum: 0.08,
            easing: "ease",
            speed: reducedMotion ? 0 : 220,
            trickle: !reducedMotion,
            trickleSpeed: 180,
        });
    };

    applyConfiguration();
    reducedMotionQuery.addEventListener("change", applyConfiguration);

    return () => {
        reducedMotionQuery.removeEventListener("change", applyConfiguration);
    };
}

export function startNavigationProgress() {
    clearProgressFailsafe();
    progressActive = true;
    NProgress.start();

    progressFailsafe = setTimeout(() => {
        progressActive = false;
        progressFailsafe = null;
        NProgress.done(true);
    }, PROGRESS_FAILSAFE_MS);
}

export function finishNavigationProgress() {
    if (!progressActive) {
        return;
    }

    progressActive = false;
    clearProgressFailsafe();
    NProgress.done();
}

export function resetNavigationProgress() {
    progressActive = false;
    clearProgressFailsafe();
    NProgress.status = null;
    NProgress.remove();
}
