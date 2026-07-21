package com.shop.vympel.dtos.analytics;

public record ProductAnalyticsSummaryResponse(
        long views,
        long favorites,
        long cartAdditions,
        double addToCartRate
) {
}
