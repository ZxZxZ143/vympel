import type {IProductDetails} from "@/api/types/ProductTypes";

export type BreadcrumbItem = {name: string; url: string};

export function buildProductStructuredData(product: IProductDetails, canonicalUrl: string) {
    const description = product.description?.shortText?.trim()
        || product.description?.content?.trim()
        || product.description?.title?.trim()
        || undefined;
    const images = product.images
        .map((image) => safeAbsoluteUrl(image.url, canonicalUrl))
        .filter((value): value is string => Boolean(value));
    const ratingCount = Number(product.ratingCount);
    const ratingAverage = Number(product.ratingAverage);
    const aggregateRating = ratingCount > 0 && ratingAverage >= 1 && ratingAverage <= 5
        ? {"@type": "AggregateRating", ratingValue: ratingAverage, reviewCount: ratingCount}
        : undefined;
    return {
        "@context": "https://schema.org",
        "@type": "Product",
        url: canonicalUrl,
        name: product.name,
        image: images.length ? images : undefined,
        sku: product.sku?.trim() || undefined,
        model: product.model?.trim() || undefined,
        brand: product.brand?.name ? {"@type": "Brand", name: product.brand.name} : undefined,
        description,
        offers: Number.isFinite(product.price) && product.price >= 0 ? {
            "@type": "Offer",
            url: canonicalUrl,
            priceCurrency: "KZT",
            price: product.price,
            availability: productIsUnavailable(product)
                ? "https://schema.org/OutOfStock"
                : "https://schema.org/InStock",
        } : undefined,
        aggregateRating,
    };
}

export function buildBreadcrumbStructuredData(items: BreadcrumbItem[]) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };
}

export function serializeJsonLd(value: unknown): string {
    return JSON.stringify(value).replace(/</g, "\\u003c");
}

function productIsUnavailable(product: Pick<IProductDetails, "stockQuantity" | "status">) {
    const stock = product.stockQuantity == null ? null : Number(product.stockQuantity);
    return product.status.toUpperCase() !== "ACTIVE" || (Number.isFinite(stock) && stock! <= 0);
}

function safeAbsoluteUrl(value: string, base: string): string | null {
    try {
        const url = new URL(value, base);
        return url.protocol === "https:" ? url.toString() : null;
    } catch {
        return null;
    }
}
