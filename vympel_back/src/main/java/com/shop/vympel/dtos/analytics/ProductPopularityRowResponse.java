package com.shop.vympel.dtos.analytics;

import java.math.BigDecimal;
import java.time.Instant;

public record ProductPopularityRowResponse(
        Long productId,
        String sku,
        String name,
        String model,
        Integer stockQuantity,
        String status,
        String promotionMode,
        BigDecimal promotionScore,
        Instant promotedUntil,
        long views,
        long favorites,
        long cartAdditions,
        double addToCartRate,
        boolean promotionRecommended,
        double recommendedPromotionScore,
        String recommendationReasonCode
) {
}
