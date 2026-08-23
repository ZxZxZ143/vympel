import {describe, expect, it} from "vitest";

function luminance(hex: string) {
    const channels = hex.match(/[a-f\d]{2}/gi)!.map((value) => {
        const channel = Number.parseInt(value, 16) / 255;
        return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground: string, background = "#ffffff") {
    const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    return (values[0] + 0.05) / (values[1] + 0.05);
}

describe("audited solid-background contrast tokens", () => {
    it("keeps request guidance above 4.5:1", () => expect(contrast("#555555")).toBeGreaterThanOrEqual(4.5));
    it("keeps search close and inactive carousel dots above 3:1", () => {
        expect(contrast("#33363f")).toBeGreaterThanOrEqual(3);
        expect(contrast("#8c909f")).toBeGreaterThanOrEqual(3);
    });
});
