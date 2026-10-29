import {describe, expect, it} from "vitest";
import {
    HOME_MOTION,
    isHorizontallyVisible,
    partitionByHorizontalVisibility,
    readMotionNumber,
    unveilClipPath,
} from "@/components/HomePage/HomeMotion/motion";

describe("home motion helpers", () => {
    it("treats only boxes intersecting the viewport width as visible", () => {
        expect(isHorizontallyVisible({left: 0, right: 300}, 1440)).toBe(true);
        expect(isHorizontallyVisible({left: 1400, right: 1700}, 1440)).toBe(true);
        expect(isHorizontallyVisible({left: 1440, right: 1700}, 1440)).toBe(false);
        expect(isHorizontallyVisible({left: -300, right: 0}, 1440)).toBe(false);
    });

    it("splits carousel slides into visible and off-canvas groups in DOM order", () => {
        const boxes = new Map([
            ["first", {left: 0, right: 270}],
            ["second", {left: 300, right: 570}],
            ["offCanvas", {left: 1500, right: 1770}],
            ["looped", {left: -400, right: -130}],
        ]);

        const {visible, hidden} = partitionByHorizontalVisibility(
            ["first", "offCanvas", "second", "looped"].map((id) => ({id}) as unknown as Element),
            1440,
            (element) => boxes.get((element as unknown as {id: string}).id)!,
        );

        expect(visible.map((element) => (element as unknown as {id: string}).id)).toEqual(["first", "second"]);
        expect(hidden.map((element) => (element as unknown as {id: string}).id)).toEqual(["offCanvas", "looped"]);
    });

    it("reads numeric data attributes with a safe fallback", () => {
        expect(readMotionNumber("140", 80)).toBe(140);
        expect(readMotionNumber("-5", 0)).toBe(-5);
        expect(readMotionNumber(undefined, 80)).toBe(80);
        expect(readMotionNumber("  ", 80)).toBe(80);
        expect(readMotionNumber("fast", 80)).toBe(80);
    });

    it("unveils media from the left only when requested", () => {
        expect(unveilClipPath("left")).toBe("inset(0% 100% 0% 0%)");
        expect(unveilClipPath(undefined)).toBe("inset(0% 0% 100% 0%)");
        expect(unveilClipPath("diagonal")).toBe("inset(0% 0% 100% 0%)");
    });

    it("keeps the hero parallax inside the extra scale headroom", () => {
        const headroomPercent = ((HOME_MOTION.heroParallax.scale - 1) / 2) * 100;

        expect(HOME_MOTION.heroParallax.yPercent).toBeLessThan(headroomPercent);
    });
});
