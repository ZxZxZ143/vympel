import {CartStoreItem, getAvailableStock, isProductUnavailable} from "@/services/localProductStorage";
import {formatProductPrice} from "@/utils/formatProductPrice";

export type CartCheckoutIssue =
    | "empty"
    | "missingProductData"
    | "unavailable"
    | "stockLimit";

type WhatsAppOrderMessageLabels = {
    greeting: string;
    quantity: string;
    unitPrice: string;
    lineTotal: string;
    article: string;
    total: string;
    piece: string;
};

type BuildWhatsAppOrderMessageOptions = {
    currencySymbol: string;
    labels: WhatsAppOrderMessageLabels;
    locale: string;
};

export function getCartCheckoutIssue(items: CartStoreItem[]): CartCheckoutIssue | null {
    if (items.length === 0) {
        return "empty";
    }

    for (const item of items) {
        if (!item.snapshot?.sku) {
            return "missingProductData";
        }

        if (isProductUnavailable(item.snapshot)) {
            return "unavailable";
        }

        const availableStock = getAvailableStock(item.snapshot);

        if (availableStock != null && item.quantity > availableStock) {
            return "stockLimit";
        }
    }

    return null;
}

export function buildWhatsAppOrderMessage(
    items: CartStoreItem[],
    {currencySymbol, labels, locale}: BuildWhatsAppOrderMessageOptions
): string {
    const itemBlocks = items.map((item, index) => {
        const snapshot = item.snapshot;
        const unitPrice = snapshot?.price ?? 0;
        const lineTotal = unitPrice * item.quantity;

        return [
            `${index + 1}. ${snapshot?.name ?? ""}`,
            `${labels.quantity}: ${item.quantity} ${labels.piece}`,
            `${labels.unitPrice}: ${formatProductPrice(unitPrice, locale, currencySymbol)}`,
            `${labels.lineTotal}: ${formatProductPrice(lineTotal, locale, currencySymbol)}`,
            `${labels.article}: ${snapshot?.sku ?? ""}`,
        ].join("\n");
    });

    const total = items.reduce((sum, item) => sum + ((item.snapshot?.price ?? 0) * item.quantity), 0);

    return [
        labels.greeting,
        ...itemBlocks,
        `${labels.total}: ${formatProductPrice(total, locale, currencySymbol)}`,
    ].join("\n\n");
}

export function buildWhatsAppOrderUrl(baseUrl: string, message: string): string {
    const separator = baseUrl.includes("?") ? "&" : "?";

    return `${baseUrl}${separator}text=${encodeURIComponent(message)}`;
}
