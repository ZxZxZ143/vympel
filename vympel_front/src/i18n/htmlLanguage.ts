import {HTML_LANGUAGE_BY_APP_LOCALE} from "@/i18n/appLocale";
import {LocaleEnum} from "@/i18n/routing";

export function toHtmlLanguage(locale: string): string {
    return HTML_LANGUAGE_BY_APP_LOCALE[locale as LocaleEnum] ?? HTML_LANGUAGE_BY_APP_LOCALE[LocaleEnum.RU];
}
