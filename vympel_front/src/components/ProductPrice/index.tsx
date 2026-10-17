"use client";

import {useLocale, useTranslations} from "use-intl";
import {customerPrice, validDiscount, type ProductPricing} from "@/utils/productPricing";
import {formatProductPrice} from "@/utils/formatProductPrice";

export function DiscountBadge({discountPercent, className = ""}: Pick<ProductPricing, "discountPercent"> & {className?: string}) {
    const t = useTranslations("pricing");
    const discount = validDiscount(discountPercent);
    if (discount === null) return null;
    return <span className={`product-price__badge ${className}`.trim()} aria-label={t("discount", {percent: discount})}>−{discount}%</span>;
}

export default function ProductPrice({price, discountPercent, finalPrice, showDiscountBadge = true}: ProductPricing & {showDiscountBadge?: boolean}) {
    const locale = useLocale();
    const t = useTranslations("pricing");
    const discount = validDiscount(discountPercent);
    const effective = customerPrice({price, discountPercent, finalPrice});
    const format = (value: number) => formatProductPrice(value, locale, "₸");
    return <span className="product-price">
        <data value={effective} aria-label={discount !== null ? t("final", {price: format(effective)}) : undefined}>{format(effective)}</data>
        {discount !== null ? <del className="product-price__original" aria-label={t("original", {price: format(price)})}>{format(price)}</del> : null}
        {showDiscountBadge ? <DiscountBadge discountPercent={discount}/> : null}
    </span>;
}
