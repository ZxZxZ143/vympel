import NProgress from "nprogress";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import {
    finishNavigationProgress,
    resetNavigationProgress,
    startNavigationProgress,
} from "./navigationProgressController";

vi.mock("nprogress", () => ({
    default: {
        configure: vi.fn(),
        done: vi.fn(),
        remove: vi.fn(),
        start: vi.fn(),
    },
}));

describe("navigation progress lifecycle", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        resetNavigationProgress();
        vi.mocked(NProgress.remove).mockClear();
    });

    afterEach(() => {
        resetNavigationProgress();
        vi.useRealTimers();
    });

    it("starts and completes an active navigation", () => {
        startNavigationProgress();
        finishNavigationProgress();

        expect(NProgress.start).toHaveBeenCalledOnce();
        expect(NProgress.done).toHaveBeenCalledOnce();
    });

    it("does not render a completion animation when nothing is active", () => {
        finishNavigationProgress();

        expect(NProgress.done).not.toHaveBeenCalled();
    });

    it("clears the library status so pending trickle work cannot recreate the bar", () => {
        NProgress.status = 0.4;

        resetNavigationProgress();

        expect(NProgress.status).toBeNull();
        expect(NProgress.remove).toHaveBeenCalledOnce();
    });

    it("forces cleanup when a navigation never commits", () => {
        startNavigationProgress();
        vi.advanceTimersByTime(15_000);

        expect(NProgress.done).toHaveBeenCalledWith(true);
    });

    it("resets the failure timeout when another navigation starts", () => {
        startNavigationProgress();
        vi.advanceTimersByTime(10_000);
        startNavigationProgress();
        vi.advanceTimersByTime(5_000);

        expect(NProgress.done).not.toHaveBeenCalled();

        vi.advanceTimersByTime(10_000);
        expect(NProgress.done).toHaveBeenCalledWith(true);
    });

});
