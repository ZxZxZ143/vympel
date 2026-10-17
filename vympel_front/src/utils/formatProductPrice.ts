import {toFormattingLocale} from "@/i18n/appLocale";

export const formatProductPrice = (
    price: number,
    locale: string,
    currencySymbol: string
) => {
    const formatLocale = toFormattingLocale(locale);
    const english = formatLocale === "en-US";
    // Browser and Node ICU versions disagree on kk-KZ separators. Keep SSR
    // and hydrated prices identical while retaining localized numeric parts.
    const amount = new Intl.NumberFormat(formatLocale).formatToParts(price)
        .map((part) => part.type === "group" ? (english ? "," : "\u00a0")
            : part.type === "decimal" ? (english ? "." : ",") : part.value)
        .join("");
    return `${amount} ${currencySymbol}`;
};
