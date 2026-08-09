import {describe, expect, it} from "vitest";

import {resolveGlobalErrorLocale} from "./globalErrorLocale";

describe("global error locale resolver", () => {
    it.each([
        ["/ru/product/1", "en", {locale: "ru", htmlLanguage: "ru"}],
        ["/kz/product/1", "ru", {locale: "kz", htmlLanguage: "kk"}],
        ["/en/product/1", "ru", {locale: "en", htmlLanguage: "en"}],
        ["/unknown", "kk", {locale: "kz", htmlLanguage: "kk"}],
        ["/", "en-US", {locale: "en", htmlLanguage: "en"}],
        [undefined, undefined, {locale: "ru", htmlLanguage: "ru"}],
    ])("resolves %s and %s", (pathname, language, expected) => {
        expect(resolveGlobalErrorLocale(pathname, language)).toEqual(expected);
    });
});
