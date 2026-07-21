const numberLocaleByAppLocale: Record<string, string> = {
    ru: "ru-RU",
    kz: "kk-KZ",
    en: "en-US",
};

export const formatProductPrice = (
    price: number,
    locale: string,
    currencySymbol: string
) => `${price.toLocaleString(numberLocaleByAppLocale[locale] ?? numberLocaleByAppLocale.ru)} ${currencySymbol}`;
