import type {ICategoryWithParent} from "@/api/types/CategoryTypes";
import {LocaleEnum} from "@/i18n/routing";
import {routes} from "@/config/routes";
import {buildBreadcrumbStructuredData, serializeJsonLd} from "@/lib/structuredData";

export function catalogBreadcrumbJsonLd(
    category: ICategoryWithParent | null,
    locale: LocaleEnum,
    siteUrl: URL,
    canonicalUrl: string,
    labels: {home: string; allGoods: string},
) {
    const categories: ICategoryWithParent[] = [];
    let current = category;
    while (current) {
        categories.push(current);
        current = current.parent;
    }
    categories.reverse();
    return serializeJsonLd(buildBreadcrumbStructuredData([
        {name: labels.home, url: new URL(routes.withLocale(locale, routes.home()), siteUrl).toString()},
        ...categories.map((item) => ({
            name: item.name,
            url: new URL(routes.withLocale(locale, routes.category(item.code)), siteUrl).toString(),
        })),
        {name: labels.allGoods, url: canonicalUrl},
    ]));
}
