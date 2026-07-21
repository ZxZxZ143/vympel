import {getRequestConfig} from "next-intl/server";
import {routing, type LocaleEnum} from "./routing";

export default getRequestConfig(async ({requestLocale}) => {
    const locale = (await requestLocale) as string;

    if (!routing.locales.includes(locale as LocaleEnum)) {
        return {locale: routing.defaultLocale, messages: (await import(`./../messages/${routing.defaultLocale}.json`)).default};
    }

    return {
        locale,
        messages: (await import(`./../messages/${locale}.json`)).default,
    };
});
