"use client";

import {useEffect, useMemo} from "react";
import type {FocusEventHandler, KeyboardEventHandler, PointerEventHandler} from "react";
import type {AutoplayType} from "embla-carousel-autoplay";
import type {CarouselApi} from "@/components/ui/Carousel";

type AutoplayPort = Pick<AutoplayType, "play" | "stop">;

export type CarouselAutoplayLifecycle = ReturnType<typeof createCarouselAutoplayLifecycle>;

export function createCarouselAutoplayLifecycle(plugin: AutoplayPort) {
    let enabled = false;
    let reducedMotion = true;
    let pointerInside = false;
    let focusInside = false;
    let dragging = false;
    let playRequested = false;

    const sync = (force = false) => {
        const shouldPlay = enabled && !reducedMotion && !pointerInside && !focusInside && !dragging;
        if (!force && shouldPlay === playRequested) {
            return;
        }

        playRequested = shouldPlay;
        if (shouldPlay) {
            plugin.play(false);
        } else {
            plugin.stop();
        }
    };

    const update = (current: boolean, next: boolean, assign: (value: boolean) => void) => {
        if (current === next) {
            return;
        }
        assign(next);
        sync();
    };

    return {
        setEnabled(value: boolean) {
            update(enabled, value, (next) => {
                enabled = next;
            });
        },
        setReducedMotion(value: boolean) {
            update(reducedMotion, value, (next) => {
                reducedMotion = next;
            });
        },
        pointerEnter() {
            update(pointerInside, true, (next) => {
                pointerInside = next;
            });
        },
        pointerLeave() {
            update(pointerInside, false, (next) => {
                pointerInside = next;
            });
        },
        focusEnter() {
            update(focusInside, true, (next) => {
                focusInside = next;
            });
        },
        focusLeave() {
            update(focusInside, false, (next) => {
                focusInside = next;
            });
        },
        dragStart() {
            update(dragging, true, (next) => {
                dragging = next;
            });
        },
        dragEnd() {
            update(dragging, false, (next) => {
                dragging = next;
            });
        },
        resynchronize() {
            sync(true);
        },
        reinitialize() {
            dragging = false;
            sync(true);
        },
        stop() {
            enabled = false;
            playRequested = false;
            plugin.stop();
        },
    };
}

type CarouselAutoplayMountOptions = {
    api: CarouselApi | undefined;
    lifecycle: CarouselAutoplayLifecycle;
    enabled: boolean;
    motionPreference: Pick<MediaQueryList, "matches" | "addEventListener" | "removeEventListener">;
    visibilitySource: Pick<Document, "visibilityState" | "addEventListener" | "removeEventListener">;
    requestFrame: typeof requestAnimationFrame;
    cancelFrame: typeof cancelAnimationFrame;
};

export function mountCarouselAutoplayLifecycle({
    api,
    lifecycle,
    enabled,
    motionPreference,
    visibilitySource,
    requestFrame,
    cancelFrame,
}: CarouselAutoplayMountOptions) {
    let startFrame: number | undefined;
    let visibilityFrame: number | undefined;
    let unbind: (() => void) | undefined;

    const syncMotionPreference = () => lifecycle.setReducedMotion(motionPreference.matches);
    const resynchronizeWhenVisible = () => {
        if (visibilitySource.visibilityState !== "visible") {
            return;
        }
        if (visibilityFrame !== undefined) {
            cancelFrame(visibilityFrame);
        }
        visibilityFrame = requestFrame(() => {
            visibilityFrame = undefined;
            lifecycle.resynchronize();
        });
    };

    syncMotionPreference();
    motionPreference.addEventListener("change", syncMotionPreference);
    visibilitySource.addEventListener("visibilitychange", resynchronizeWhenVisible);

    lifecycle.setEnabled(false);
    lifecycle.dragEnd();
    if (api && enabled) {
        unbind = bindCarouselAutoplayLifecycle(api, lifecycle);
        startFrame = requestFrame(() => {
            startFrame = undefined;
            lifecycle.setEnabled(true);
        });
    }

    return () => {
        if (startFrame !== undefined) {
            cancelFrame(startFrame);
        }
        if (visibilityFrame !== undefined) {
            cancelFrame(visibilityFrame);
        }
        unbind?.();
        motionPreference.removeEventListener("change", syncMotionPreference);
        visibilitySource.removeEventListener("visibilitychange", resynchronizeWhenVisible);
        lifecycle.stop();
    };
}

export function createCarouselAutoplayInteractionController(lifecycle: CarouselAutoplayLifecycle) {
    let pointerDrivenFocus = false;

    return {
        pointerEnter(pointerType: string) {
            if (pointerType === "mouse") {
                lifecycle.pointerEnter();
            }
        },
        pointerLeave(pointerType: string) {
            if (pointerType === "mouse") {
                lifecycle.pointerLeave();
            }
            pointerDrivenFocus = false;
        },
        pointerDown() {
            pointerDrivenFocus = true;
            lifecycle.focusLeave();
        },
        pointerEnd() {
            pointerDrivenFocus = false;
        },
        keyDown() {
            pointerDrivenFocus = false;
            lifecycle.focusEnter();
        },
        focus(focusIsOnCarouselRoot: boolean) {
            if (!focusIsOnCarouselRoot && !pointerDrivenFocus) {
                lifecycle.focusEnter();
            }
        },
        blur(focusRemainsInside: boolean) {
            if (focusRemainsInside) {
                return;
            }
            pointerDrivenFocus = false;
            lifecycle.focusLeave();
        },
    };
}

export function bindCarouselAutoplayLifecycle(
    api: NonNullable<CarouselApi>,
    lifecycle: CarouselAutoplayLifecycle,
) {
    api.on("pointerDown", lifecycle.dragStart);
    api.on("pointerUp", lifecycle.dragEnd);
    api.on("reInit", lifecycle.reinitialize);

    return () => {
        api.off("pointerDown", lifecycle.dragStart);
        api.off("pointerUp", lifecycle.dragEnd);
        api.off("reInit", lifecycle.reinitialize);
    };
}

type CarouselAutoplayHandlers = {
    onPointerEnter: PointerEventHandler<HTMLDivElement>;
    onPointerLeave: PointerEventHandler<HTMLDivElement>;
    onPointerDownCapture: PointerEventHandler<HTMLDivElement>;
    onPointerUpCapture: PointerEventHandler<HTMLDivElement>;
    onPointerCancelCapture: PointerEventHandler<HTMLDivElement>;
    onKeyDown: KeyboardEventHandler<HTMLDivElement>;
    onFocusCapture: FocusEventHandler<HTMLDivElement>;
    onBlurCapture: FocusEventHandler<HTMLDivElement>;
};

export function useCarouselAutoplayLifecycle(
    api: CarouselApi | undefined,
    plugin: AutoplayType,
    enabled: boolean,
): CarouselAutoplayHandlers {
    const lifecycle = useMemo(() => createCarouselAutoplayLifecycle(plugin), [plugin]);
    const interaction = useMemo(
        () => createCarouselAutoplayInteractionController(lifecycle),
        [lifecycle],
    );

    useEffect(() => {
        return mountCarouselAutoplayLifecycle({
            api,
            lifecycle,
            enabled,
            motionPreference: window.matchMedia("(prefers-reduced-motion: reduce)"),
            visibilitySource: document,
            requestFrame: (callback) => window.requestAnimationFrame(callback),
            cancelFrame: (frame) => window.cancelAnimationFrame(frame),
        });
    }, [api, enabled, lifecycle]);

    return useMemo<CarouselAutoplayHandlers>(() => ({
        onPointerEnter: (event) => interaction.pointerEnter(event.pointerType),
        onPointerLeave: (event) => interaction.pointerLeave(event.pointerType),
        onPointerDownCapture: () => interaction.pointerDown(),
        onPointerUpCapture: () => interaction.pointerEnd(),
        onPointerCancelCapture: () => interaction.pointerEnd(),
        onKeyDown: () => interaction.keyDown(),
        onFocusCapture: (event) => interaction.focus(event.target === event.currentTarget),
        onBlurCapture: (event) => {
            const nextTarget = event.relatedTarget;
            interaction.blur(nextTarget instanceof Node && event.currentTarget.contains(nextTarget));
        },
    }), [interaction]);
}
