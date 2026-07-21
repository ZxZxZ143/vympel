import {describe, expect, it} from "vitest";
import {toHtmlLanguage} from "./htmlLanguage";

describe("toHtmlLanguage", () => {
    it.each([
        ["ru", "ru"],
        ["en", "en"],
        ["kz", "kk"],
    ])("maps %s to the HTML language tag %s", (locale, expected) => {
        expect(toHtmlLanguage(locale)).toBe(expected);
    });
});
