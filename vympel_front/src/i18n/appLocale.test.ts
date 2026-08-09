import {describe, expect, it} from "vitest";

import {LocaleEnum} from "@/i18n/routing";
import {FORMAT_LOCALE_BY_APP_LOCALE, HTML_LANGUAGE_BY_APP_LOCALE, toFormattingLocale} from "./appLocale";

describe("app locale mappings", () => {
    it("keeps route, HTML language, and Intl locale contracts distinct", () => {
        expect(HTML_LANGUAGE_BY_APP_LOCALE).toEqual({ru: "ru", kz: "kk", en: "en"});
        expect(FORMAT_LOCALE_BY_APP_LOCALE).toEqual({ru: "ru-RU", kz: "kk-KZ", en: "en-US"});
        expect(toFormattingLocale(LocaleEnum.KZ)).toBe("kk-KZ");
        expect(new Intl.DateTimeFormat(toFormattingLocale(LocaleEnum.KZ)).resolvedOptions().locale)
            .toMatch(/^kk(?:-|$)/i);
    });
});
