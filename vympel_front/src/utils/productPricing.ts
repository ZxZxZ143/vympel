export type ProductPricing = {price: number; discountPercent?: number | null; finalPrice?: number | null};

export function validDiscount(value: unknown): number | null {
    return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 99 ? value : null;
}

export function customerPrice(product: ProductPricing): number {
    const discount = validDiscount(product.discountPercent);
    if (discount === null) return product.price;
    // Prefer the fresh server calculation; the fallback supports older stored snapshots.
    if (typeof product.finalPrice === "number" && Number.isFinite(product.finalPrice)
        && product.finalPrice >= 0 && product.finalPrice <= product.price) return product.finalPrice;
    return Math.round(product.price * (100 - discount) / 100);
}
