package com.shop.vympel.services.product;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Prices retain the existing whole-tenge API contract; base price is never mutated. */
public final class ProductPricing {
    private ProductPricing() {}

    public static Integer finalPrice(Integer price, Integer discountPercent) {
        validateDiscount(discountPercent);
        if (price == null || discountPercent == null) return price;
        return BigDecimal.valueOf(price).multiply(BigDecimal.valueOf(100 - discountPercent))
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP).intValueExact();
    }

    public static void validateDiscount(Integer value) {
        if (value != null && (value < 1 || value > 99)) {
            throw new IllegalArgumentException("Discount must be an integer from 1 to 99 or null");
        }
    }
}
