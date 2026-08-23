import {describe, expect, it, vi} from "vitest";
import type {CarouselApi} from "@/components/ui/Carousel";
import {
    bindCarouselAutoplayLifecycle,
    createCarouselAutoplayInteractionController,
    createCarouselAutoplayLifecycle,
    mountCarouselAutoplayLifecycle,
    type CarouselAutoplayLifecycle,
} from "@/hooks/useCarouselAutoplayLifecycle";

function createPlugin() {
    return {
        play: vi.fn(),
        stop: vi.fn(),
    };
}

function createEventApi() {
    type Listener = () => void;
    const listeners = new Map<string, Set<Listener>>();
    const api = {
        on: vi.fn((event: string, listener: Listener) => {
            const eventListeners = listeners.get(event) ?? new Set<Listener>();
            eventListeners.add(listener);
            listeners.set(event, eventListeners);
            return api;
        }),
        off: vi.fn((event: string, listener: Listener) => {
            listeners.get(event)?.delete(listener);
            return api;
        }),
    };

    return {
        api: api as unknown as NonNullable<CarouselApi>,
        emit(event: string) {
            listeners.get(event)?.forEach((listener) => listener());
        },
    };
}

describe("carousel autoplay lifecycle", () => {
    it("starts automatically, pauses for repeated hover, and resumes on leave", () => {
        const plugin = createPlugin();
        const lifecycle = createCarouselAutoplayLifecycle(plugin);

        lifecycle.setReducedMotion(false);
        lifecycle.setEnabled(true);
        expect(plugin.play).toHaveBeenCalledOnce();
        expect(plugin.play).toHaveBeenLastCalledWith(false);

        lifecycle.pointerEnter();
        lifecycle.pointerEnter();
        expect(plugin.stop).toHaveBeenCalledOnce();

        lifecycle.pointerLeave();
        lifecycle.pointerLeave();
        expect(plugin.play).toHaveBeenCalledTimes(2);

        lifecycle.pointerEnter();
        lifecycle.pointerLeave();
        expect(plugin.stop).toHaveBeenCalledTimes(2);
        expect(plugin.play).toHaveBeenCalledTimes(3);
    });

    it("keeps hover and focus pauses authoritative across drag completion", () => {
        const plugin = createPlugin();
        const lifecycle = createCarouselAutoplayLifecycle(plugin);

        lifecycle.setReducedMotion(false);
        lifecycle.setEnabled(true);
        lifecycle.pointerEnter();
        lifecycle.dragStart();
        lifecycle.dragEnd();
        expect(plugin.play).toHaveBeenCalledOnce();

        lifecycle.pointerLeave();
        expect(plugin.play).toHaveBeenCalledTimes(2);

        lifecycle.focusEnter();
        lifecycle.dragStart();
        lifecycle.dragEnd();
        expect(plugin.play).toHaveBeenCalledTimes(2);

        lifecycle.focusLeave();
        expect(plugin.play).toHaveBeenCalledTimes(3);
    });

    it("resumes after touch-style drag without depending on a hover leave event", () => {
        const plugin = createPlugin();
        const lifecycle = createCarouselAutoplayLifecycle(plugin);

        lifecycle.setReducedMotion(false);
        lifecycle.setEnabled(true);
        lifecycle.dragStart();
        expect(plugin.stop).toHaveBeenCalledOnce();

        lifecycle.dragEnd();
        expect(plugin.play).toHaveBeenCalledTimes(2);
    });

    it("treats reinitialization as cancellation of an active drag", () => {
        const plugin = createPlugin();
        const lifecycle = createCarouselAutoplayLifecycle(plugin);

        lifecycle.setReducedMotion(false);
        lifecycle.setEnabled(true);
        lifecycle.dragStart();
        lifecycle.reinitialize();
        expect(plugin.play).toHaveBeenCalledTimes(2);

        lifecycle.pointerEnter();
        lifecycle.dragStart();
        lifecycle.reinitialize();
        expect(plugin.play).toHaveBeenCalledTimes(2);

        lifecycle.pointerLeave();
        expect(plugin.play).toHaveBeenCalledTimes(3);

        lifecycle.focusEnter();
        lifecycle.dragStart();
        lifecycle.reinitialize();
        expect(plugin.play).toHaveBeenCalledTimes(3);

        lifecycle.focusLeave();
        expect(plugin.play).toHaveBeenCalledTimes(4);
    });

    it("stays stopped for reduced motion and reasserts state after visibility restoration", () => {
        const plugin = createPlugin();
        const lifecycle = createCarouselAutoplayLifecycle(plugin);

        lifecycle.setReducedMotion(false);
        lifecycle.setEnabled(true);
        lifecycle.setReducedMotion(true);
        expect(plugin.play).toHaveBeenCalledOnce();

        plugin.play(false);
        lifecycle.resynchronize();
        expect(plugin.stop).toHaveBeenCalledTimes(2);

        lifecycle.stop();
        expect(plugin.stop).toHaveBeenCalledTimes(3);
    });

    it("resumes after pointer-driven focus leaves but keeps keyboard focus paused", () => {
        const plugin = createPlugin();
        const lifecycle = createCarouselAutoplayLifecycle(plugin);
        const interaction = createCarouselAutoplayInteractionController(lifecycle);

        lifecycle.setReducedMotion(false);
        lifecycle.setEnabled(true);

        interaction.pointerEnter("mouse");
        interaction.pointerDown();
        interaction.focus(false);
        interaction.pointerEnd();
        interaction.focus(true);
        interaction.pointerLeave("mouse");
        expect(plugin.play).toHaveBeenCalledTimes(2);

        interaction.keyDown();
        expect(plugin.stop).toHaveBeenCalledTimes(2);

        interaction.pointerEnter("mouse");
        interaction.pointerLeave("mouse");
        expect(plugin.play).toHaveBeenCalledTimes(2);

        interaction.blur(false);
        expect(plugin.play).toHaveBeenCalledTimes(3);

        interaction.pointerDown();
        interaction.pointerLeave("touch");
        interaction.focus(false);
        expect(plugin.stop).toHaveBeenCalledTimes(3);

        interaction.blur(false);
        expect(plugin.play).toHaveBeenCalledTimes(4);

        interaction.pointerEnter("touch");
        interaction.pointerLeave("touch");
        expect(plugin.stop).toHaveBeenCalledTimes(3);
    });

    it("keeps multiple carousel instances independent", () => {
        const firstPlugin = createPlugin();
        const secondPlugin = createPlugin();
        const first = createCarouselAutoplayLifecycle(firstPlugin);
        const second = createCarouselAutoplayLifecycle(secondPlugin);

        for (const lifecycle of [first, second]) {
            lifecycle.setReducedMotion(false);
            lifecycle.setEnabled(true);
        }

        first.pointerEnter();
        expect(firstPlugin.stop).toHaveBeenCalledOnce();
        expect(secondPlugin.stop).not.toHaveBeenCalled();
        expect(secondPlugin.play).toHaveBeenCalledOnce();
    });

    it("removes Embla listeners during lifecycle cleanup", () => {
        const eventApi = createEventApi();
        const lifecycle = {
            dragStart: vi.fn(),
            dragEnd: vi.fn(),
            reinitialize: vi.fn(),
        } as unknown as CarouselAutoplayLifecycle;
        const unbind = bindCarouselAutoplayLifecycle(eventApi.api, lifecycle);

        eventApi.emit("pointerDown");
        eventApi.emit("pointerUp");
        eventApi.emit("reInit");
        expect(lifecycle.dragStart).toHaveBeenCalledOnce();
        expect(lifecycle.dragEnd).toHaveBeenCalledOnce();
        expect(lifecycle.reinitialize).toHaveBeenCalledOnce();

        unbind();
        eventApi.emit("pointerDown");
        eventApi.emit("pointerUp");
        eventApi.emit("reInit");
        expect(lifecycle.dragStart).toHaveBeenCalledOnce();
        expect(lifecycle.dragEnd).toHaveBeenCalledOnce();
        expect(lifecycle.reinitialize).toHaveBeenCalledOnce();
        expect(eventApi.api.off).toHaveBeenCalledTimes(3);
    });

    it("cancels pending frames, removes external listeners, unbinds Embla, and stops on cleanup", () => {
        type Listener = () => void;
        const motionListeners = new Set<Listener>();
        const visibilityListeners = new Set<Listener>();
        const motionPreference = {
            matches: false,
            addEventListener: vi.fn((_event: string, listener: Listener) => motionListeners.add(listener)),
            removeEventListener: vi.fn((_event: string, listener: Listener) => motionListeners.delete(listener)),
        };
        const visibilitySource = {
            visibilityState: "visible",
            addEventListener: vi.fn((_event: string, listener: Listener) => visibilityListeners.add(listener)),
            removeEventListener: vi.fn((_event: string, listener: Listener) => visibilityListeners.delete(listener)),
        };
        const frames = new Map<number, FrameRequestCallback>();
        let nextFrame = 0;
        const requestFrame = vi.fn((callback: FrameRequestCallback) => {
            const frame = ++nextFrame;
            frames.set(frame, callback);
            return frame;
        });
        const cancelFrame = vi.fn((frame: number) => frames.delete(frame));
        const eventApi = createEventApi();
        const plugin = createPlugin();
        const lifecycle = createCarouselAutoplayLifecycle(plugin);

        const cleanup = mountCarouselAutoplayLifecycle({
            api: eventApi.api,
            lifecycle,
            enabled: true,
            motionPreference: motionPreference as unknown as MediaQueryList,
            visibilitySource: visibilitySource as unknown as Document,
            requestFrame,
            cancelFrame,
        });

        expect(requestFrame).toHaveBeenCalledOnce();
        expect(eventApi.api.on).toHaveBeenCalledTimes(3);
        expect(motionListeners.size).toBe(1);
        expect(visibilityListeners.size).toBe(1);

        visibilityListeners.forEach((listener) => listener());
        expect(requestFrame).toHaveBeenCalledTimes(2);

        cleanup();
        expect(cancelFrame).toHaveBeenCalledTimes(2);
        expect(frames.size).toBe(0);
        expect(eventApi.api.off).toHaveBeenCalledTimes(3);
        expect(motionListeners.size).toBe(0);
        expect(visibilityListeners.size).toBe(0);
        expect(motionPreference.removeEventListener).toHaveBeenCalledOnce();
        expect(visibilitySource.removeEventListener).toHaveBeenCalledOnce();
        expect(plugin.stop).toHaveBeenCalledOnce();
    });
});
