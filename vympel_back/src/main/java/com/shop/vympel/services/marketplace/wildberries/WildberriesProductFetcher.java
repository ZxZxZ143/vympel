package com.shop.vympel.services.marketplace.wildberries;

public interface WildberriesProductFetcher {
    FetchedProduct fetch(String sourceUrl);

    record FetchedProduct(
            String canonicalUrl,
            long productId,
            String catalogJson,
            String detailsJson
    ) {
    }
}
