import {LocaleEnum} from "@/i18n/routing";

export type SeoContent = {
    title: string;
    description: string;
};

export type StaticSeoPage = "home" | "about" | "brands" | "catalog" | "delivery" | "payment" | "guarantee" | "productUnavailable";

const STATIC_CONTENT: Record<LocaleEnum, Record<StaticSeoPage, SeoContent>> = {
    [LocaleEnum.RU]: {
        home: {
            title: "Vympel — официальный дистрибьютор премиальных часов",
            description: "Vympel — авторизованный дистрибьютор оригинальных наручных и интерьерных часов в Казахстане. Мировые бренды, гарантия и доставка.",
        },
        about: {
            title: "О компании Vympel — официальный магазин часов",
            description: "Узнайте о Vympel: более 30 лет опыта в дистрибуции оригинальных часов, авторизованный ассортимент, сервис и гарантия в Казахстане.",
        },
        brands: {
            title: "Бренды часов — Vympel",
            description: "Откройте коллекции Romanson, Adriatica, Appella, Pierre Ricaud, Rhythm и Royal London в официальном каталоге Vympel.",
        },
        catalog: {
            title: "Каталог часов и аксессуаров — Vympel",
            description: "Выберите оригинальные наручные и интерьерные часы, а также аксессуары из официального ассортимента Vympel с гарантией.",
        },
        delivery: {
            title: "Доставка — Vympel",
            description: "Условия и способы доставки заказов Vympel по Казахстану, включая доставку через доступные маркетплейсы.",
        },
        payment: {
            title: "Оплата — Vympel",
            description: "Способы оплаты заказов Vympel на маркетплейсах и при самовывозе из магазина.",
        },
        guarantee: {
            title: "Гарантия — Vympel",
            description: "Условия гарантии, сервисного обслуживания и возврата оригинальных часов, приобретённых в Vympel.",
        },
        productUnavailable: {title: "Товар временно недоступен — Vympel", description: "Не удалось загрузить информацию о товаре."},
    },
    [LocaleEnum.KZ]: {
        home: {
            title: "Vympel — премиум сағаттардың ресми дистрибьюторы",
            description: "Vympel — Қазақстандағы түпнұсқа қол сағаттары мен интерьерлік сағаттардың авторизацияланған дистрибьюторы. Әлемдік брендтер, кепілдік және жеткізу.",
        },
        about: {
            title: "Vympel компаниясы туралы — ресми сағат дүкені",
            description: "Vympel туралы біліңіз: түпнұсқа сағаттарды таратудағы 30 жылдан астам тәжірибе, авторизацияланған ассортимент, сервис және кепілдік.",
        },
        brands: {
            title: "Сағат брендтері — Vympel",
            description: "Vympel ресми каталогындағы Romanson, Adriatica, Appella, Pierre Ricaud, Rhythm және Royal London топтамаларын қараңыз.",
        },
        catalog: {
            title: "Сағаттар мен аксессуарлар каталогы — Vympel",
            description: "Vympel ресми ассортиментінен кепілдігі бар түпнұсқа қол сағаттарын, интерьерлік сағаттарды және аксессуарларды таңдаңыз.",
        },
        delivery: {
            title: "Жеткізу — Vympel",
            description: "Vympel тапсырыстарын Қазақстан бойынша, соның ішінде қолжетімді маркетплейстер арқылы жеткізу шарттары мен тәсілдері.",
        },
        payment: {
            title: "Төлем — Vympel",
            description: "Vympel тапсырыстарын маркетплейстерде және дүкеннен алып кету кезінде төлеу тәсілдері.",
        },
        guarantee: {
            title: "Кепілдік — Vympel",
            description: "Vympel дүкенінен сатып алынған түпнұсқа сағаттарға кепілдік, сервистік қызмет көрсету және қайтару шарттары.",
        },
        productUnavailable: {title: "Тауар уақытша қолжетімсіз — Vympel", description: "Тауар туралы ақпаратты жүктеу мүмкін болмады."},
    },
    [LocaleEnum.EN]: {
        home: {
            title: "Vympel — official distributor of premium watches",
            description: "Vympel is an authorized distributor of original wristwatches and interior clocks in Kazakhstan, offering global brands, warranty service, and delivery.",
        },
        about: {
            title: "About Vympel — official watch store",
            description: "Discover Vympel's 30+ years of experience distributing original watches, with an authorized assortment, service, and warranty support in Kazakhstan.",
        },
        brands: {
            title: "Watch brands — Vympel",
            description: "Explore Romanson, Adriatica, Appella, Pierre Ricaud, Rhythm, and Royal London collections in the official Vympel catalog.",
        },
        catalog: {
            title: "Watches and accessories catalog — Vympel",
            description: "Shop original wristwatches, interior clocks, and accessories from the official Vympel assortment with warranty support.",
        },
        delivery: {
            title: "Delivery — Vympel",
            description: "Delivery terms and options for Vympel orders across Kazakhstan, including delivery through available marketplaces.",
        },
        payment: {
            title: "Payment — Vympel",
            description: "Payment options for Vympel orders on marketplaces and for collection from the store.",
        },
        guarantee: {
            title: "Warranty — Vympel",
            description: "Warranty, service, and return terms for original watches purchased from Vympel.",
        },
        productUnavailable: {title: "Product temporarily unavailable — Vympel", description: "The product information could not be loaded."},
    },
};

export function staticSeoContent(locale: LocaleEnum, page: StaticSeoPage): SeoContent {
    return STATIC_CONTENT[locale][page];
}

export function categorySeoContent(locale: LocaleEnum, categoryName: string): SeoContent {
    const cleanCategoryName = plainSeoText(categoryName);
    const title = `${cleanCategoryName} — Vympel`;
    const description = locale === LocaleEnum.RU
        ? `${cleanCategoryName} в каталоге Vympel: оригинальные товары официального ассортимента с гарантией.`
        : locale === LocaleEnum.KZ
            ? `${cleanCategoryName} Vympel каталогында: ресми ассортименттегі түпнұсқа тауарлар және кепілдік.`
            : `Explore ${cleanCategoryName} in the Vympel catalog: original products from the official assortment with warranty support.`;
    return {title, description};
}

export function brandSeoContent(locale: LocaleEnum, brandName: string, visibleDescription: string): SeoContent {
    const cleanBrandName = plainSeoText(brandName);
    const title = locale === LocaleEnum.RU
        ? `${cleanBrandName} — часы | Vympel`
        : locale === LocaleEnum.KZ
            ? `${cleanBrandName} — сағаттар | Vympel`
            : `${cleanBrandName} watches | Vympel`;
    return {title, description: concise(visibleDescription)};
}

type ProductSeoSource = {
    name: string;
    model?: string | null;
    brand?: {name?: string | null} | null;
    description?: {content?: string | null; shortText?: string | null; title?: string | null} | null;
};

export function productSeoContent(locale: LocaleEnum, product: ProductSeoSource): SeoContent {
    const name = plainSeoText(product.name);
    const model = plainSeoText(product.model ?? "");
    const brand = plainSeoText(product.brand?.name ?? "");
    const productTitle = (
        brand && !containsIdentity(name, brand)
            ? [brand, model && !containsIdentity(name, model) ? model : "", name]
            : [name, model && !containsIdentity(name, model) ? model : ""]
    ).filter(Boolean).join(" ") || "Vympel";
    const availableDescription = [
        product.description?.shortText,
        product.description?.content,
        product.description?.title,
    ].map((value) => plainSeoText(value ?? "")).find(Boolean);
    const fallback = locale === LocaleEnum.RU
        ? `${productTitle} в каталоге Vympel.`
        : locale === LocaleEnum.KZ
            ? `${productTitle} Vympel каталогында.`
            : `${productTitle} in the Vympel catalog.`;
    return {
        title: `${productTitle} — Vympel`,
        description: concise(availableDescription || fallback),
    };
}

export function plainSeoText(value: string): string {
    return value
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, " $1 ")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, " $1 ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => safeCodePoint(code, 16))
        .replace(/&#(\d+);/g, (_, code: string) => safeCodePoint(code, 10))
        .replace(/&(nbsp|amp|quot|apos|lt|gt);/gi, (_, entity: string) => ({
            nbsp: " ", amp: "&", quot: "\"", apos: "'", lt: "<", gt: ">",
        })[entity.toLowerCase()] ?? " ")
        .replace(/^\s{0,3}#{1,6}\s+/gm, "")
        .replace(/[*_~`>|]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function safeCodePoint(code: string, radix: number): string {
    const value = Number.parseInt(code, radix);
    if (!Number.isSafeInteger(value) || value < 0 || value > 0x10ffff) return " ";
    try {
        return String.fromCodePoint(value);
    } catch {
        return " ";
    }
}

function containsIdentity(value: string, candidate: string): boolean {
    const normalize = (input: string) => input.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
    const normalizedCandidate = normalize(candidate);
    return normalizedCandidate.length > 0 && normalize(value).includes(normalizedCandidate);
}

function concise(value: string, maximumLength = 160): string {
    const normalized = plainSeoText(value);
    if (normalized.length <= maximumLength) return normalized;
    const lastCompleteWord = normalized.slice(0, maximumLength).lastIndexOf(" ");
    const nextWordBoundary = normalized.indexOf(" ", maximumLength);
    const cutAt = lastCompleteWord > 0 ? lastCompleteWord : nextWordBoundary;
    if (cutAt < 0) return normalized;
    return `${normalized.slice(0, cutAt).replace(/[\s,.;:!?-]+$/u, "")}…`;
}
