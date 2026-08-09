import {toFormattingLocale} from "@/i18n/appLocale";

export const formatProductPrice = (
    price: number,
    locale: string,
    currencySymbol: string
) => `${price.toLocaleString(toFormattingLocale(locale))} ${currencySymbol}`;
