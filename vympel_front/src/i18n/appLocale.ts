import {LocaleEnum} from "@/i18n/routing";

export const HTML_LANGUAGE_BY_APP_LOCALE: Record<LocaleEnum, "ru" | "kk" | "en"> = {
    [LocaleEnum.RU]: "ru",
    [LocaleEnum.KZ]: "kk",
    [LocaleEnum.EN]: "en",
};

export const FORMAT_LOCALE_BY_APP_LOCALE: Record<LocaleEnum, "ru-RU" | "kk-KZ" | "en-US"> = {
    [LocaleEnum.RU]: "ru-RU",
    [LocaleEnum.KZ]: "kk-KZ",
    [LocaleEnum.EN]: "en-US",
};

export function toFormattingLocale(locale: string): string {
    return FORMAT_LOCALE_BY_APP_LOCALE[locale as LocaleEnum] ?? FORMAT_LOCALE_BY_APP_LOCALE[LocaleEnum.RU];
}
