import {afterEach, describe, expect, it, vi} from "vitest";
import {formatProductPrice} from "./formatProductPrice";

afterEach(() => vi.restoreAllMocks());

describe("stable localized product prices", () => {
    it.each(["ru", "kz", "unknown"])("uses nonbreaking groups and comma decimals for %s", (locale) => {
        expect(formatProductPrice(107955.5, locale, "₸")).toBe("107\u00a0955,5 ₸");
    });
    it("preserves English separators and the caller's currency", () => {
        expect(formatProductPrice(107955.5, "en", "KZT")).toBe("107,955.5 KZT");
    });
    it("normalizes differing Kazakh browser ICU separators to the server output", () => {
        const server = formatProductPrice(107955.5, "kz", "₸");
        vi.spyOn(Intl.NumberFormat.prototype, "formatToParts").mockReturnValue([
            {type: "integer", value: "107"}, {type: "group", value: ","},
            {type: "integer", value: "955"}, {type: "decimal", value: "."},
            {type: "fraction", value: "5"},
        ]);
        expect(formatProductPrice(107955.5, "kz", "₸")).toBe(server);
    });
});
