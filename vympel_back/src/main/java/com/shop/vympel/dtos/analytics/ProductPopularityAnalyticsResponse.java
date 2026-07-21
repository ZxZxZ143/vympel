package com.shop.vympel.dtos.analytics;

import java.time.Instant;
import java.util.List;

public record ProductPopularityAnalyticsResponse(
        String period,
        Instant generatedAt,
        ProductAnalyticsSummaryResponse summary,
        List<ProductPopularityRowResponse> mostViewed,
        List<ProductPopularityRowResponse> mostFavorited,
        List<ProductPopularityRowResponse> mostAddedToCart,
        List<ProductPopularityRowResponse> lowDemand,
        List<ProductPopularityRowResponse> highInterest,
        List<ProductPopularityRowResponse> promotionRecommendations
) {
}
