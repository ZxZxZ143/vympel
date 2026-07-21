export enum LocaleEnum {
    RU = "ru",
    KZ = "kz",
    EN = "en",
}

export const locales = [LocaleEnum.RU, LocaleEnum.KZ, LocaleEnum.EN] as const;

export type LocalesType = (typeof locales)[number];

export const routing = {
    locales,
    defaultLocale: LocaleEnum.RU,
    localePrefix: "always"
} as const;

export type RoutingType = (typeof routing);
