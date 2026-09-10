package com.shop.vympel.services.marketplace.wildberries;

import com.shop.vympel.services.marketplace.kaspi.KaspiParsedProduct;

public record WildberriesParsedProduct(
        KaspiParsedProduct product,
        String sourceCategory
) {
}
