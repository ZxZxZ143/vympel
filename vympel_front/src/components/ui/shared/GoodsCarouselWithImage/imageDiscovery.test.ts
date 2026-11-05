import {describe, expect, it} from "vitest";
import {adjacentImageIndexes, imageIdentity, INITIAL_IMAGE_COUNT} from "./imageDiscovery";

describe("goods carousel discovery policy", () => {
    it("covers the widest initial viewport without discovering the whole list", () => {
        expect(INITIAL_IMAGE_COUNT).toBe(4);
        expect(adjacentImageIndexes([0, 1], 20).sort()).toEqual([0, 1, 2]);
        expect(adjacentImageIndexes([0, 1, 2, 3], 20).sort()).toEqual([0, 1, 2, 3, 4]);
    });
    it("bounds each side and never wraps first/last for a non-looping rail", () => {
        expect(adjacentImageIndexes([5, 6], 12).sort()).toEqual([4, 5, 6, 7]);
        expect(adjacentImageIndexes([0], 12)).toEqual([0, 1]);
        expect(adjacentImageIndexes([11], 12)).toEqual([10, 11]);
    });
    it("handles empty/short/reinitialized views and ignores invalid indexes", () => {
        expect(adjacentImageIndexes([], 0)).toEqual([]);
        expect(adjacentImageIndexes([0], 1)).toEqual([0]);
        expect(adjacentImageIndexes([-1, 0, 0, 1, 2, 0.5, NaN], 2)).toEqual([0, 1]);
        expect(adjacentImageIndexes([4, 5, 6, 7], 8).sort()).toEqual([3, 4, 5, 6, 7]);
    });
    it("tracks product AND resource identity across reordering/replacement", () => {
        expect(imageIdentity({id: 3, imageUrl: "/a.png"})).toBe(imageIdentity({id: 3, img: "/a.png"}));
        expect(imageIdentity({id: 3, img: "/a.png"})).not.toBe(imageIdentity({id: 4, img: "/a.png"}));
        expect(imageIdentity({id: 3, img: "/a.png"})).not.toBe(imageIdentity({id: 3, img: "/b.png"}));
    });
});
