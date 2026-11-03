import {describe, expect, it} from "vitest";
import {nearbySlide, responsiveImage} from "./responsiveImages";

const base = `https://media.test/bucket/product/responsive-v1/12345678-1234-1234-1234-123456789012/${"a".repeat(64)}/1086x1448`;
const original = `${base}/original.png`;

describe("completed responsive image families", () => {
    it("never guesses derivatives for existing, signed, animated or malformed URLs", () => {
        for (const url of ["/product/old.png", "/photo.webp", `${base}/original.gif`, `${original}?X-Amz-Signature=private`, original.replace("1086x1448", "10000x10000")]) {
            expect(responsiveImage(url)).toEqual({src: url});
        }
    });
    it("uses small thumbnails, true width descriptors, and retains the original for full-resolution viewing", () => {
        const thumb = responsiveImage(original, 320);
        expect(thumb.srcSet).toBe(`${base}/w160.webp 160w, ${base}/w320.webp 320w`);
        expect(responsiveImage(original).srcSet).toContain(`${base}/w1086.webp 1086w`);
        expect(responsiveImage(original).srcSet).not.toContain("1200w");
        expect(responsiveImage(original, 0)).toEqual({src: original});
    });
    it("drops only CMS freshness query strings from immutable derivatives", () => {
        expect(responsiveImage(`${original}?v=2026-11-03`).srcSet).toBe(responsiveImage(original).srcSet);
    });
    it("retains source resolution without upscaling small uploads", () => {
        expect(responsiveImage(original.replace("1086x1448", "80x120"), 320).srcSet).toMatch(/w80.webp 80w$/);
    });
    it("mounts only the selected and adjacent slides including the loop boundary", () => {
        expect(Array.from({length: 8}, (_, index) => nearbySlide(index, 0, 8))).toEqual([true, true, false, false, false, false, false, true]);
        expect(nearbySlide(0, 0, 1)).toBe(true);
    });
});
