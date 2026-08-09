import {LocaleEnum} from "@/i18n/routing";

export type SeoContent = {
    title: string;
    description: string;
};

export type StaticSeoPage = "home" | "about" | "brands" | "catalog" | "delivery" | "payment" | "guarantee" | "productUnavailable";

const STATIC_CONTENT: Record<LocaleEnum, Record<StaticSeoPage, SeoContent>> = {
    [LocaleEnum.RU]: {
        home: {title: "Vympel — часы и аксессуары", description: "Каталог наручных и интерьерных часов, а также аксессуаров Vympel."},
        about: {title: "О компании Vympel", description: "История, подход к выбору часов и сотрудничество с компанией Vympel."},
        brands: {title: "Бренды часов — Vympel", description: "Бренды часов, представленные в каталоге Vympel."},
        catalog: {title: "Каталог часов и аксессуаров — Vympel", description: "Каталог наручных и интерьерных часов и аксессуаров Vympel."},
        delivery: {title: "Доставка — Vympel", description: "Информация о доставке товаров из каталога Vympel."},
        payment: {title: "Оплата — Vympel", description: "Информация о способах оплаты товаров Vympel."},
        guarantee: {title: "Гарантия — Vympel", description: "Информация о гарантии и возврате товаров Vympel."},
        productUnavailable: {title: "Товар временно недоступен — Vympel", description: "Не удалось загрузить информацию о товаре."},
    },
    [LocaleEnum.KZ]: {
        home: {title: "Vympel — сағаттар мен аксессуарлар", description: "Vympel қол сағаттары, интерьер сағаттары және аксессуарлар каталогы."},
        about: {title: "Vympel компаниясы туралы", description: "Vympel компаниясының тарихы, сағаттарды таңдау тәсілі және ынтымақтастық туралы."},
        brands: {title: "Сағат брендтері — Vympel", description: "Vympel каталогында ұсынылған сағат брендтері."},
        catalog: {title: "Сағаттар мен аксессуарлар каталогы — Vympel", description: "Vympel қол сағаттары, интерьер сағаттары және аксессуарлар каталогы."},
        delivery: {title: "Жеткізу — Vympel", description: "Vympel каталогындағы тауарларды жеткізу туралы ақпарат."},
        payment: {title: "Төлем — Vympel", description: "Vympel тауарларын төлеу тәсілдері туралы ақпарат."},
        guarantee: {title: "Кепілдік — Vympel", description: "Vympel тауарларының кепілдігі мен қайтарылуы туралы ақпарат."},
        productUnavailable: {title: "Тауар уақытша қолжетімсіз — Vympel", description: "Тауар туралы ақпаратты жүктеу мүмкін болмады."},
    },
    [LocaleEnum.EN]: {
        home: {title: "Vympel — watches and accessories", description: "Vympel catalog of wristwatches, interior clocks, and accessories."},
        about: {title: "About Vympel", description: "Vympel's story, approach to selecting watches, and cooperation information."},
        brands: {title: "Watch brands — Vympel", description: "Watch brands represented in the Vympel catalog."},
        catalog: {title: "Watches and accessories catalog — Vympel", description: "Vympel catalog of wristwatches, interior clocks, and accessories."},
        delivery: {title: "Delivery — Vympel", description: "Delivery information for products in the Vympel catalog."},
        payment: {title: "Payment — Vympel", description: "Information about payment methods for Vympel products."},
        guarantee: {title: "Guarantee — Vympel", description: "Information about guarantees and returns for Vympel products."},
        productUnavailable: {title: "Product temporarily unavailable — Vympel", description: "The product information could not be loaded."},
    },
};

export function staticSeoContent(locale: LocaleEnum, page: StaticSeoPage): SeoContent {
    return STATIC_CONTENT[locale][page];
}

export function categorySeoContent(locale: LocaleEnum, categoryName: string): SeoContent {
    const title = `${categoryName} — Vympel`;
    const description = locale === LocaleEnum.RU
        ? `${categoryName} в каталоге часов и аксессуаров Vympel.`
        : locale === LocaleEnum.KZ
            ? `${categoryName} — Vympel сағаттары мен аксессуарлары каталогында.`
            : `${categoryName} in the Vympel watches and accessories catalog.`;
    return {title, description};
}

export function brandSeoContent(brandName: string, visibleDescription: string): SeoContent {
    return {title: `${brandName} — Vympel`, description: concise(visibleDescription)};
}

export function productSeoContent(locale: LocaleEnum, product: {name: string; model?: string | null; description?: {content?: string | null; shortText?: string | null; title?: string | null} | null}): SeoContent {
    const availableDescription = product.description?.shortText
        ?? product.description?.content
        ?? product.description?.title;
    const fallback = locale === LocaleEnum.RU
        ? `${product.name} в каталоге Vympel.`
        : locale === LocaleEnum.KZ
            ? `${product.name} Vympel каталогында.`
            : `${product.name} in the Vympel catalog.`;
    return {
        title: `${product.name}${product.model ? ` ${product.model}` : ""} — Vympel`,
        description: concise(availableDescription?.trim() || fallback),
    };
}

function concise(value: string): string {
    const normalized = value.replace(/\s+/g, " ").trim();
    if (normalized.length <= 180) return normalized;
    return `${normalized.slice(0, 177).trimEnd()}…`;
}
