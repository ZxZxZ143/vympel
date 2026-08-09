export type GlobalErrorLocale = "ru" | "kz" | "en";
export type GlobalErrorHtmlLanguage = "ru" | "kk" | "en";

export type ResolvedGlobalErrorLocale = {
    locale: GlobalErrorLocale;
    htmlLanguage: GlobalErrorHtmlLanguage;
};

export function resolveGlobalErrorLocale(pathname?: string | null, documentLanguage?: string | null): ResolvedGlobalErrorLocale {
    const routePrefix = pathname?.split("/").filter(Boolean)[0]?.toLowerCase();
    if (routePrefix === "ru" || routePrefix === "kz" || routePrefix === "en") {
        return {
            locale: routePrefix,
            htmlLanguage: routePrefix === "kz" ? "kk" : routePrefix,
        };
    }

    const normalizedLanguage = documentLanguage?.trim().toLowerCase().split("-")[0];
    if (normalizedLanguage === "kk" || normalizedLanguage === "kz") {
        return {locale: "kz", htmlLanguage: "kk"};
    }
    if (normalizedLanguage === "en") return {locale: "en", htmlLanguage: "en"};
    return {locale: "ru", htmlLanguage: "ru"};
}
